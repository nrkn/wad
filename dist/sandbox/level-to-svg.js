"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const data_1 = require("../data");
const image_to_canvas_1 = require("./image-to-canvas");
const invertY = ({ x, y }) => {
    y *= -1;
    return { x, y };
};
exports.levelToSvg = (om, level, settings) => {
    // doom y is inverted
    const vertexes = level.vertexes.map(invertY);
    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;
    vertexes.forEach(({ x, y }) => {
        if (x < minX)
            minX = x;
        if (x > maxX)
            maxX = x;
        if (y < minY)
            minY = y;
        if (y > maxY)
            maxY = y;
    });
    const width = maxX - minX;
    const height = maxY - minY;
    const div = document.createElement('div');
    const svgText = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - 8} ${minY - 8} ${width + 16} ${height + 16}">
      ${settings.grid ? grid : ''}
      ${settings.vertexes ? vertexesToSvg(vertexes) : ''}
      ${settings.linedefs ? linedefsToSvg(level.linedefs, vertexes) : ''}
      ${settings.sidedefs ? sidedefsToSvg(level.linedefs, level.sidedefs, vertexes) : ''}
      ${settings.things ? thingsToSvg(level.things) : ''}
      ${settings.sectors ? sectorsToSvg(level) : ''}
    </svg>
  `;
    div.innerHTML = svgText;
    const svg = div.firstElementChild;
    Object.assign(svg.dataset, { minX, minY, maxX, maxY, width, height });
    decorateThings(om, svg);
    return svg;
};
const grid = `
  <defs>
    <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse">
      <path d="M 8 0 L 0 0 0 8" fill="none" stroke="gray" stroke-width="0.5"/>
    </pattern>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <rect width="64" height="64" fill="url(#smallGrid)"/>
      <path d="M 64 0 L 0 0 0 64" fill="none" stroke="gray" stroke-width="1"/>
    </pattern>
  </defs>

  <rect x="-32768" y ="-32768" width="65535" height="65535" fill="url(#grid)" />
`;
const vertexesToSvg = (vertexes) => vertexes.map(({ x, y }) => `<circle class="vertex" cx="${x}" cy="${y}" r="${2}"></circle>`).join('');
const linedefsToSvg = (linedefs, vertexes) => linedefs.map(linedef => {
    const { startVertex, endVertex } = linedef;
    const start = vertexes[startVertex];
    const end = vertexes[endVertex];
    return `<line class="linedef" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="black"></line>`;
}).join('');
const thingsToSvg = (things) => things.map(thing => {
    const { type } = thing;
    const { x, y } = invertY(thing);
    return `<circle class="thing" data-type="${type}" cx="${x}" cy="${y}" r="${32}" fill="rgba( 127, 127, 127, 0.5 )"></circle>`;
}).join('');
const sidedefsToSvg = (linedefs, sidedefs, vertexes) => {
    const length = 8;
    let svg = '';
    linedefs.forEach(linedef => {
        const start = vertexes[linedef.startVertex];
        const end = vertexes[linedef.endVertex];
        const left = sidedefs[linedef.leftSidedef];
        const right = sidedefs[linedef.rightSidedef];
        const mid = util_1.midPoint(start, end);
        const r = util_1.rads(start, end);
        if (left) {
            const newR = r + Math.PI / 2;
            const newEnd = util_1.lineEnd(mid, newR, length);
            svg += `<line class="sidedef left" x1="${mid.x}" y1="${mid.y}" x2="${newEnd.x}" y2="${newEnd.y}" stroke="red"></line>`;
        }
        if (right) {
            const newR = r - Math.PI / 2;
            const newEnd = util_1.lineEnd(mid, newR, length);
            svg += `<line class="sidedef right" x1="${mid.x}" y1="${mid.y}" x2="${newEnd.x}" y2="${newEnd.y}" stroke="blue"></line>`;
        }
    });
    return svg;
};
const sectorsToSvg = (level) => {
    const { linedefs, sidedefs, sectors } = level;
    const vertexes = level.vertexes.map(invertY);
    const hueStep = 360 / (sectors.length + 1);
    let svg = '';
    sectors.forEach((_sector, s) => {
        const hue = s * hueStep;
        linedefs.forEach(linedef => {
            const left = sidedefs[linedef.leftSidedef];
            const right = sidedefs[linedef.rightSidedef];
            if ((left && left.sector === s) || (right && right.sector === s)) {
                const { startVertex, endVertex } = linedef;
                const start = vertexes[startVertex];
                const end = vertexes[endVertex];
                svg += `<line class="sector" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="hsla(${hue},100%,50%,0.5)"></line>`;
            }
        });
    });
    return svg;
};
const decorateThings = (om, svg) => {
    const things = svg.querySelectorAll('.thing');
    things.forEach(thing => {
        const type = parseInt(thing.dataset.type);
        const data = data_1.thingData.find(t => t.type === type);
        if (!data)
            return;
        if (data.spritePrefix === '')
            return;
        let spriteName = data.spritePrefix + 'A0';
        if (!(spriteName in om.sprites))
            spriteName = data.spritePrefix + 'A1';
        if (!(spriteName in om.sprites))
            return;
        const cx = parseFloat(thing.getAttribute('cx'));
        const cy = parseFloat(thing.getAttribute('cy'));
        const sprite = om.sprites[spriteName];
        const x = cx - sprite.left;
        const y = cy - sprite.top;
        const canvas = image_to_canvas_1.imageToCanvas(sprite, om.playpal[0], 1);
        const url = canvas.toDataURL();
        /*
        const flippedCanvas = document.createElement( 'canvas' )
        const context = flippedCanvas.getContext( '2d' )!
    
        flippedCanvas.width = canvas.width
        flippedCanvas.height = canvas.height
    
        context.translate( 0, canvas.height )
        context.scale( 1, -1 )
        context.drawImage( canvas, 0, 0 )
    
        const url = flippedCanvas.toDataURL()
        */
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.classList.add('thing');
        image.dataset.type = String(type);
        image.setAttribute('width', `${sprite.width}`);
        image.setAttribute('height', `${sprite.height}`);
        image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', url);
        image.setAttribute('x', `${x}`);
        image.setAttribute('y', `${y}`);
        thing.after(image);
        thing.remove();
    });
};
//# sourceMappingURL=level-to-svg.js.map