"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs_1 = require("fs");
const utils_1 = require("./fixtures/utils");
const __1 = require("..");
const blockmap_1 = require("../lumps/writers/blockmap");
const testWadData = fs_1.readFileSync('./src/test/fixtures/doom1.wad');
const testWad = __1.readWad(testWadData);
const { lumps } = testWad;
const lumpTypes = Object.keys(utils_1.testLumps);
const testLump = (lumpType) => {
    const lumpName = (utils_1.testLumps[lumpType] === true ?
        lumpType :
        utils_1.testLumps[lumpType]);
    it(lumpType, () => {
        const expect = utils_1.decompress(fs_1.readFileSync(`./src/test/fixtures/expect/lumps/${lumpType}.json.gz`));
        const lump = utils_1.findLump(lumps, lumpName.toUpperCase());
        const result = JSON.parse(utils_1.stringify(__1.readLumpData(lump.data, lumpType)));
        assert.deepEqual(result, expect);
    });
};
describe('read lumps', () => {
    lumpTypes.forEach(testLump);
    it('fails on bad lump name', () => {
        assert.throws(() => __1.readLumpData(lumps[0].data, 'bad lump name'));
    });
    it('no lumpname means raw', () => {
        const expect = utils_1.decompress(fs_1.readFileSync(`./src/test/fixtures/expect/lumps/raw.json.gz`));
        const lump = utils_1.findLump(lumps, 'DEMO1');
        const result = JSON.parse(utils_1.stringify(__1.readLumpData(lump.data)));
        assert.deepEqual(result, expect);
    });
});
describe('write lumps', () => {
    it('blockmap', () => {
        const blockmapLump = utils_1.findLump(lumps, 'BLOCKMAP');
        const blockmap = __1.readLumpData(blockmapLump.data, 'BLOCKMAP');
        const outLump = blockmap_1.writeBlockmap(blockmap);
        assert.deepEqual(outLump, blockmapLump);
    });
});
//# sourceMappingURL=lumps.js.map