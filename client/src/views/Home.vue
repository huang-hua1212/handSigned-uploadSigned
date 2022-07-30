<template>
  <div class="home">
    <h1>步驟一</h1>
    <h3>繪製簽名檔</h3>
    <hand-signed
      :style = 'style'
      @setSignData = 'setSignData'
    ></hand-signed>
    <h1>步驟二</h1>
    <h3>上傳文件</h3>
    <upload-file
    :style = 'style'
    @setPdfSrc = 'setPdfSrc'></upload-file>
    <h1>步驟三</h1>
    <h3>合併輸出</h3>
    <output-signed-file
    :signData = 'signData'
    :pdfSrc = 'pdfSrc'></output-signed-file>
  </div>
</template>

<script>
import HandSigned from '@/components/HandSigned.vue';
import UploadFile from '@/components/UploadFile.vue';
import OutputSignedFile from '@/components/OutputSignedFile.vue';
// import OutputSignedFile from '@/components/OutputSignedFile.vue';

export default {
  data() {
    return {
      style: {
        width: 500,
        height: 300,
      },
      signData: '',
      pdfSrc: '',
    };
  },
  components: { HandSigned, UploadFile, OutputSignedFile },
  methods: {
    setSignData(signData) {
      this.signData = signData;
    },
    setPdfSrc(pdfSrc) {
      this.pdfSrc = pdfSrc;
    },
  },
};
</script>
<style>
.canvas {
  display: flex;
  justify-content: center;
  align-items: center;
}
.canvas h1 {
  width: 100%;
}
* {
  -webkit-touch-callout: none;

  /* iOS Safari */
  -webkit-user-select: none;

  /* Safari */
  -khtml-user-select: none;

  /* Konqueror HTML */
  -moz-user-select: none;

  /* Firefox */
  -ms-user-select: none;

  /* Internet Explorer/Edge */
  user-select: none;

  /* Non-prefixed version, currently supported by Chrome and Opera */
}
</style>
