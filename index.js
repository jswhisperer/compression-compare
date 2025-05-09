// import { compress, decompress, init } from '@bokuweb/zstd-wasm';
// import { ZstdInit } from '@oneidentity/zstd-js';
// import { CompressionStream, DecompressionStream } from '@ungap/compression-stream';
// import byteSize from 'byte-size';
// import LZString from 'lz-string';

import {Buffer} from 'https://cdn.jsdelivr.net/npm/buffer@6.0.3/+esm'
import { compress, decompress, init } from 'https://cdn.jsdelivr.net/npm/@bokuweb/zstd-wasm@0.0.27/+esm'
import { ZstdInit } from'https://cdn.jsdelivr.net/npm/@oneidentity/zstd-js@1.0.3/+esm'
import { CompressionStream, DecompressionStream } from 'https://cdn.jsdelivr.net/npm/@ungap/compression-stream@0.1.0/+esm'
import byteSize from 'https://cdn.jsdelivr.net/npm/byte-size@7.0.0/+esm'
import LZString from 'https://cdn.jsdelivr.net/npm/lz-string@1.4.4/+esm'



const sampleData = Array.from("hi".repeat(999999))


const fileSizeReadable = (fileSizeInBytes) => {
    const fileSize = byteSize(fileSizeInBytes);
    return `File size: ${fileSize.value}${fileSize.unit}`
}


(async () => {
  await init('./zstd.wasm');
  const Buffered = Buffer.from(sampleData.toString())
  const compressed = compress(Buffered, 10);
  const res = decompress(compressed);
  const response = Buffer.from(res).toString();
  var compressedLZ = LZString.compress(sampleData.toString());

  console.table({
    "zstd-wasm uncompressed": fileSizeReadable(Buffered.byteLength), "zstd-wasm compressed": fileSizeReadable(compressed.byteLength),
    "LZ compressed": fileSizeReadable(compressedLZ.length),
    "are they equal?": sampleData.toString() === response});
})();



ZstdInit().then(({ZstdSimple, ZstdStream}) => {
  // Create some sample data to compress
  // const data  = new Uint8Array(Array.from("hi".repeat(9999)).toString());

  const data = new Uint8Array(sampleData)

  const compressionLevel = 20;

  const compressedStreamData = ZstdStream.compress(data, compressionLevel);
  const decompressedStreamData = ZstdStream.decompress(compressedStreamData);

  console.table({"zstd-js uncompressed": fileSizeReadable(decompressedStreamData.byteLength), "compressed": fileSizeReadable(compressedStreamData.byteLength)});
});

/**
 * Convert a string to its UTF-8 bytes and compress it.
 *
 * @param {string} str
 * @returns {Promise<Uint8Array>}
 */
async function compressAPI(str) {
    // Convert the string to a byte stream.
    const stream = new Blob([str]).stream();

    // Create a compressed stream.
    const compressedStream = stream.pipeThrough(
      new CompressionStream("gzip")
    );

    // Read all the bytes from this stream.
    const chunks = [];
    for await (const chunk of compressedStream) {
      chunks.push(chunk);
    }
    return await concatUint8Arrays(chunks);
  }


  async function concatUint8Arrays(uint8arrays) {
    const blob = new Blob(uint8arrays);
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
  }


 async function decompressGzip(compressedBytes) {
   // Convert the bytes to a stream.
   const stream = new Blob([compressedBytes]).stream();

   // Create a decompressed stream.
   const decompressedStream = stream.pipeThrough(
     new DecompressionStream("gzip")
   );

   // Read all the bytes from this stream.
   const chunks = [];
   for await (const chunk of decompressedStream) {
     chunks.push(chunk);
   }
   const stringBytes = await concatUint8Arrays(chunks);

   // Convert the bytes to a string.
   return new TextDecoder().decode(stringBytes);
 }

const compressedBytes = await compressAPI(sampleData.toString());
const decompressedBytes = await decompressGzip(compressedBytes);
console.table(
    {"gzip uncompressed": fileSizeReadable(decompressedBytes.length), "gzip compressed": fileSizeReadable(compressedBytes.length), });