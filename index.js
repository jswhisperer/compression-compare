import {Buffer} from 'https://cdn.jsdelivr.net/npm/buffer@6.0.3/+esm'
import { compress, decompress, init } from 'https://cdn.jsdelivr.net/npm/@bokuweb/zstd-wasm@0.0.27/+esm'
import { ZstdInit } from'https://cdn.jsdelivr.net/npm/@oneidentity/zstd-js@1.0.3/+esm'
import brotli from 'https://cdn.jsdelivr.net/npm/brotli-js@1.0.2/+esm';
// import { CompressionStream, DecompressionStream } from 'https://cdn.jsdelivr.net/npm/@ungap/compression-stream@0.1.0/+esm' // nodejs shim
import byteSize from 'https://cdn.jsdelivr.net/npm/byte-size@7.0.0/+esm'
import LZString from 'https://cdn.jsdelivr.net/npm/lz-string@1.4.4/+esm'



const sampleData = Array.from("hi".repeat(999999));
const data = new Uint8Array(sampleData);

const results = []

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
  results.push({
     "------------------------------------------": "",
    "zstd-wasm uncompressed": fileSizeReadable(Buffered.byteLength), "zstd-wasm compressed": fileSizeReadable(compressed.byteLength),
    "LZ compressed": fileSizeReadable(compressedLZ.length),
    })
  // console.table();
})();



ZstdInit().then(({ZstdSimple, ZstdStream}) => {
  // Create some sample data to compress
  // const data  = new Uint8Array(Array.from("hi".repeat(9999)).toString());

 

  const compressionLevel = 20;

  const compressedStreamData = ZstdStream.compress(data, compressionLevel);
  const decompressedStreamData = ZstdStream.decompress(compressedStreamData);

results.push({"zstd-js uncompressed": fileSizeReadable(decompressedStreamData.byteLength), "compressed": fileSizeReadable(compressedStreamData.byteLength)});
});


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

results.push({ "--------------------------------------------": "", "compressedAPI uncompressed": fileSizeReadable(sampleData.toString().length), "compressed": fileSizeReadable(compressedBytes.length), "decompressed": fileSizeReadable(decompressedBytes.length)});

    const compressedBrotli = brotli.compressArray(data, 11)
   results.push({
    "---------------------------------------------": "",
    "brotli compressed": fileSizeReadable(compressedBrotli.length)})
    const mappedResults = results.reduce(function(result, current) {
      return Object.assign(result, current);
    }, {})
   console.table(mappedResults);

   let builtTable = "";
   
   const makeTable = () => {
    for (const [key, value] of Object.entries(mappedResults)) {
      builtTable += `<tr>
      <td>${key}</td>
      <td>${value}</td>
     </tr>`
    }
   }

   makeTable()


   if(window?.document) {
    document.querySelector("table tbody").innerHTML = builtTable;
   }

  

