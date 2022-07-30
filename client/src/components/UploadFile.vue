<template>
  <div class="uploadFile" style = 'text-aligin: center'>
      <div style='margin-bottom: 1rem'>
        上傳 Image:
        <input type="file" @change='handleUploadImage' />
      </div>
      <div>
        上傳 PDF:
        <input accept=".pdf" type="file" @change='handleUploadPdf' />
      </div>

      <canvas id='canvas1' width='this.style.width' height='this.style.height'></canvas>
      <div>
        <button @click='handleConvertToImage'>輸出</button>
      </div>
     <!-- <img :src='src' alt="imagePdf" /> -->
  </div>
</template>
<script>
import * as pdfjs from 'pdfjs-dist';
// import workerSrc from 'pdfjs-dist/es5/build/pdf.worker.entry.js';
import mouseEvent from '../utils/canvas';

export default {
  data() {
    return {
      src: '',
      canvas: null,
      ctx: null,
    };
  },
  props: ['style'],
  mounted() {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.bootcss.com/pdf.js/2.14.305/pdf.worker.js';
    this.canvas = document.getElementById('canvas1');
    this.ctx = this.canvas.getContext('2d');
  },
  methods: {
    handleUploadImage(event) {
      const f = event.target.files[0];
      // const { ctx } = this;
      const img = new Image();
      img.onload = () => {
        const scaled = mouseEvent.getScaledDim(img, this.style.width, this.style.height);
        // scale canvas to image
        this.ctx.width = scaled.width;
        this.ctx.height = scaled.height;
        // draw image
        this.ctx.drawImage(img, 0, 0, this.ctx.width, this.ctx.height);
      };
      this.src = URL.createObjectURL(f);
    },

    /** pdf */
    async handleUploadPdf(event) {
      const file = event.target.files[0];
      if (file.type === 'application/pdf') {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
          const pdfData = new Uint8Array(e.target.result);
          // Using DocumentInitParameters object to load binary data.
          const loadingTask = pdfjs.getDocument({ data: pdfData });
          loadingTask.promise.then(
            (pdf) => {
              // Fetch the first page
              const pageNumber = 1;
              pdf.getPage(pageNumber).then((page) => {
                const scale = 1.5;
                const viewport = page.getViewport({ scale });

                // Prepare canvas using PDF page dimensions
                this.canvas.height = viewport.height;
                this.canvas.width = viewport.width;
                // Render PDF page into canvas context
                const renderContext = {
                  canvasContext: this.ctx,
                  viewport,
                };
                const renderTask = page.render(renderContext);
                renderTask.promise.then(() => {
                  console.log('Page rendered');
                });
              }).catch((err) => console.log(err));
            },
            (reason) => {
              // PDF loading error
              console.error(reason);
            },
          );
        };
        fileReader.readAsArrayBuffer(file);
      }
    },

    /** 輸出成圖片 */
    handleConvertToImage() {
      const image = this.canvas.toDataURL();
      this.src = image;
      this.$emit('setPdfSrc', this.src);
    },
  },
};
</script>
