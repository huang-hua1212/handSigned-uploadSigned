<template>
  <div class="outputSignedFile">
    <div class="wrapper">
      <div>
        <button @click="download">下載</button>
      </div>
      <div class="main">
        <canvas ref='canvas' id="canvasOutput" style="border: 2px solid #000"></canvas>
      </div>
    </div>
  </div>
</template>
<script>
import { fabric } from 'fabric';
import { toRaw } from 'vue';

export default {
  data() {
    return {
      canvas: null,
      canvasOriginal: {
        width: 800,
        height: 800,
      },
    };
  },
  props: ['signData', 'pdfSrc'],
  mounted() {
    // this.canvas = document.getElementById('canvasOutput');
    const c = new fabric.Canvas(this.$refs.canvas);
    // const c = new fabric.Canvas(document.getElementById('canvasOutput'));
    this.canvas = c;
  },
  watch: {
    signData() {
      if (this.canvas && this.signData) {
        fabric.Image.fromURL(this.signData, (img) => {
          img.scaleToWidth(100);
          img.scaleToHeight(100);
          this.canvas.calcOffset();
          toRaw(this.canvas).add(img).renderAll();
        });
      }
    },
    pdfSrc() {
      if (this.canvas && this.pdfSrc) {
        fabric.Image.fromURL(this.pdfSrc, (img) => {
          this.canvas.setBackgroundImage(this.pdfSrc).renderAll();
          this.canvas.setHeight(img.height);
          this.canvas.setWidth(img.width);
          this.scaleAndPositionImage(img);
        });
      }
    },
  },
  methods: {
    /** 縮放 */
    scaleAndPositionImage(bgImage) {
      const { canvasWidth, canvasHeight } = this.setCanvasZoom();
      const canvasAspect = canvasWidth / canvasHeight;
      const imgAspect = bgImage.width / bgImage.height;
      let left;
      let top;
      let scaleFactor;

      if (canvasAspect >= imgAspect) {
        scaleFactor = canvasWidth / bgImage.width;
        left = 0;
        top = -(bgImage.height * scaleFactor - canvasHeight) / 2;
      } else {
        scaleFactor = canvasHeight / bgImage.height;
        top = 0;
        left = -(bgImage.width * scaleFactor - canvasWidth) / 2;
      }
      console.log(top);
      this.canvas.setBackgroundImage(bgImage, this.canvas.renderAll.bind(this.canvas), {
        // top: -(bgImage.height * scaleFactor - canvasHeight) / 2,
        top: 0,
        left,
        originX: 'left',
        originY: 'top',
        scaleX: scaleFactor,
        scaleY: scaleFactor,
      });
    },

    setCanvasZoom() {
      const canvasWidth = this.canvasOriginal.width * 1.3;
      const canvasHeight = this.canvasOriginal.height * 1.5;

      this.canvas.setWidth(canvasWidth);
      this.canvas.setHeight(canvasHeight);
      return { canvasWidth, canvasHeight };
    },

    /** 監聽刪除 */
    handleUserKeyPress(e) {
      if (e.keyCode === 8) {
        this.deleteSelectedObjectsFromCanvas();
      }
    },

    /** 刪除選取物件 */
    deleteSelectedObjectsFromCanvas() {
      if (this.canvas) {
        const activeObject = this.canvas.getActiveObject();
        const activeGroup = this.canvas.getActiveGroup();

        if (activeObject) {
          this.canvas.remove(activeObject);
        } else if (activeGroup) {
          const objectsInGroup = activeGroup.getObjects();
          this.canvas.discardActiveGroup();
          objectsInGroup.forEach((object) => {
            this.canvas.remove(object);
          });
        }
      }
    },

    /** 下載 */
    download() {
      const dataURL = this.canvas.toDataURL({ format: 'png' });
      const link = document.createElement('a');
      link.download = 'my-image.png';
      link.href = dataURL;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    },
  },
};
</script>
<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
// const Wrapper = styled("div")`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
// `;
.main {
  position: relative;
  height: auto;
  width: 100%;
  display: flex;
  margin: 20px auto;
  align-items: center;
  justify-content: center;
}
// const Main = styled("div")`
//   position: relative;
//   height: auto;
//   width: 100%;
//   display: flex;
//   margin: 20px auto;
//   align-items: center;
//   justify-content: center;
// `;

#canvasOutput {
  position: absolute;
  left: 0;
  right: 0;

  &.sign {
    z-index: 3;
  }

  &.bg {
    z-index: 2;
    /* background: #eee; */
  }
}
// const Canvas = styled("canvas")`
//   position: absolute;
//   left: 0;
//   right: 0;

//   &.sign {
//     z-index: 3;
//   }

//   &.bg {
//     z-index: 2;
//     /* background: #eee; */
//   }
// `;
</style>
