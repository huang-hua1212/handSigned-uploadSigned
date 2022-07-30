<template>
  <div class="handSigned">
    <div>
      <canvas
        id="canvas"
        style="background: #eee; -webkit-transform: translate3d(0, 0, 0); object-fit: cover"
        :width="style.width"
        :height="style.height"
        @touchstart.prevent="handleTouchStart"
        @touchmove.prevent="handleTouchMove"
        @touchend.prevent="handleTouchEnd"
        @mousedown.prevent="handleMouseDown"
        @mousemove.prevent="handleMouseMove"
        @mouseup.prevent="handleMouseUp"
      ></canvas>
      <div>
        <button @click="handleClear">清除</button>
        <button @click="handleConvertToImage">轉圖</button>
      </div>
      <img :src="src" />
    </div>
  </div>
</template>

<script>
import mouseEvent from '../utils/canvas';

const SIZE = 10 * 1024 * 1024;
const Status = {
  wait: 'wait',
  pause: 'pause',
  uploading: 'uploading',
};
export default {
  data() {
    return {
      src: '',
      canvas: null,
      ctx: null,
      style: {
        width: 500,
        height: 400,
      },
      drawing: null,
      container: {
        file: null,
        hash: '',
        worker: null,
      },
      requestList: [],
      status: Status.wait,
      formData: null,
    };
  },
  mounted() {
    this.style.width = window.innerWidth * 0.7;
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
  },
  methods: {
    handleTouchStart(event) {
      this.drawing = true;
      const touchPos = mouseEvent.getTouchPos(this.canvas, event);
      this.ctx.beginPath(touchPos.x, touchPos.y);
      this.ctx.moveTo(touchPos.x, touchPos.y);
      event.preventDefault();
    },
    handleTouchMove(event) {
      if (!this.drawing) return;
      const touchPos = mouseEvent.getTouchPos(this.canvas, event);
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round'; // 繪制圓形的結束線帽
      this.ctx.lineJoin = 'round'; // 兩條線條交匯時，建立圓形邊角
      this.ctx.shadowBlur = 1; // 邊緣模糊，防止直線邊緣出現鋸齒
      this.ctx.shadowColor = 'black'; // 邊緣顏色
      this.ctx.lineTo(touchPos.x, touchPos.y);
      this.ctx.stroke();
    },
    handleMouseDown(event) {
      this.drawing = true;
      const mousePos = mouseEvent.getMousePos(this.canvas, event);
      this.ctx.beginPath();
      this.ctx.moveTo(mousePos.x, mousePos.y);
      event.preventDefault();
    },
    handleTouchEnd() {
      this.drawing = false;
    },
    handleMouseMove(event) {
      if (!this.drawing) return;
      const mousePos = mouseEvent.getMousePos(this.canvas, event);
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round'; // 繪制圓形的結束線帽
      this.ctx.lineJoin = 'round'; // 兩條線條交匯時，建立圓形邊角
      this.ctx.shadowBlur = 1; // 邊緣模糊，防止直線邊緣出現鋸齒
      this.ctx.shadowColor = 'black'; // 邊緣顏色
      this.ctx.lineTo(mousePos.x, mousePos.y);
      this.ctx.stroke();
    },
    handleMouseUp() {
      this.drawing = false;
    },
    handleClear() {
      this.ctx.clearRect(0, 0, this.style.width, this.style.height);
    },
    async handleConvertToImage() {
      const image = this.canvas.toDataURL();
      this.src = image;
      this.$emit('setSignData', this.src);
      // 儲存本地
      const imageSaveLocal = this.canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      await this.canvasToFile(imageSaveLocal);
      // await this.handleFileChange(imageSaveLocal);
      await this.handleFileChange(this.file);
      this.src = imageSaveLocal;
      this.handleUpload();
    },
    // 以下為將圖片上傳到server端
    handleFileChange(file) {
      if (!file) return;
      this.resetData();
      Object.assign(this.$data, this.$options.data());
      this.container.file = file;
    },
    resetData() {
      this.requestList.forEach((xhr) => xhr?.abort());
      this.requestList = [];
      if (this.container.worker) {
        this.container.worker.onmessage = null;
      }
    },
    async handleUpload() {
      if (!this.container.file) return;
      this.status = Status.uploading;
      // arr = [切片1, 切片2....]
      const fileChunkList = this.createFileChunk(this.container.file);
      // 計算出一個文件的hash值
      this.container.hash = await this.calculateHash(fileChunkList);
      const { shouldUpload, uploadedList } = await this.verifyUpload(
        this.container.file.name,
        this.container.hash,
      );
      if (!shouldUpload) {
        this.message = '秒傳: 上傳成功';
        this.status = Status.wait;
        return;
      }

      this.data = fileChunkList.map(({ file }, index) => ({
        fileHash: this.container.hash,
        index,
        hash: `${this.container.hash}-${index}`,
        chunk: file,
        size: file.size,
        percentage: uploadedList.includes(index) ? 100 : 0,
      }));

      await this.uploadChunks(uploadedList);
    },
    async uploadChunks(uploadedList = []) {
      const requestList = this.data
        .filter(({ hash }) => !uploadedList.includes(hash))
        .map(({ chunk, hash, index }) => {
          const formData = new FormData();
          formData.append('chunk', chunk);
          formData.append('hash', hash);
          formData.append('filename', this.container.file.name);
          formData.append('fileHash', this.container.hash);
          return { formData, index };
        })
        .map(({ formData }) => this.request({
          url: 'http://localhost:3000',
          data: formData,
          requestList: this.requestList,
        }));
      await Promise.all(requestList);
      // 之前上傳的切片數量 + 本次上傳的切片數量 = 所有切片數量時合併切片
      if (uploadedList.length + requestList.length === this.data.length) {
        await this.mergeRequest();
      }
    },
    // xhr
    request({
      url,
      method = 'post',
      data,
      headers = {},
      onProgress = (e) => e,
      requestList = [],
    }) {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = onProgress;
        xhr.open(method, url);
        Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]));
        xhr.send(data);
        xhr.onload = (e) => {
          // 將請求成功的 xhr 从列表中删除
          // remove xhr which status is success
          if (requestList) {
            const xhrIndex = requestList.findIndex((item) => item === xhr);
            requestList.splice(xhrIndex, 1);
          }
          resolve({
            data: e.target.response,
          });
        };
        // 暴露當前 xhr 给外部
        // export xhr
        requestList.push(xhr);
      });
    },
    // 通知服務端合併切片
    async mergeRequest() {
      await this.request({
        url: 'http://localhost:3000/merge',
        headers: {
          'content-type': 'application/json',
        },
        data: JSON.stringify({
          size: SIZE,
          fileHash: this.container.hash,
          filename: `${this.container.file.name}.jpg`,
        }),
      });
      this.message = '上傳成功';
      this.status = Status.wait;
    },
    // 生成文件切片
    // create file chunk
    createFileChunk(file, size = SIZE) {
      const fileChunkList = [];
      let cur = 0;
      while (cur < file.size) {
        fileChunkList.push({ file: file.slice(cur, cur + size) });
        cur += size;
      }
      return fileChunkList;
    },
    calculateHash(fileChunkList) {
      return new Promise((resolve) => {
        this.container.worker = new Worker('/hash.js');
        // 傳送{fileChunkList}給/hash.js
        this.container.worker.postMessage({ fileChunkList });
        // 接收/hash.js傳送的物件
        // 計算出一個文件的hash值
        this.container.worker.onmessage = (e) => {
          const { percentage, hash } = e.data;
          this.hashPercentage = percentage;
          if (hash) {
            // 回傳切片計算出的hash值
            resolve(hash);
          }
        };
      });
    },
    async canvasToFile(dataURL) {
      const blobBin = atob(dataURL.split(',')[1]);
      const array = [];
      for (let i = 0; i < blobBin.length; i += 1) {
        array.push(blobBin.charCodeAt(i));
      }
      const file = new File([new Uint8Array(array)], { type: 'image/png' });
      // const file = new Blob([new Uint8Array(array)], { type: 'image/png' });
      // const formData = new FormData();
      // await formData.append('myNewFileName', file);
      // this.formData = formData;
      this.file = file;
    },
    // 根據 hash 驗證文件是否曾经已经被上傳過
    async verifyUpload(filename, fileHash) {
      const { data } = await this.request({
        url: 'http://localhost:3000/verify',
        headers: {
          'content-type': 'application/json',
        },
        data: JSON.stringify({
          filename,
          fileHash,
        }),
      });
      return JSON.parse(data);
    },
  },
};
</script>
