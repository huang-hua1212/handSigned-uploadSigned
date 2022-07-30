const mouseEvent = {
  getMousePos: (canvas, evt) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  },

  // returns scaled dimensions object
  getScaledDim: (img, maxWidth, maxHeight) => {
    const scaled = {
      ratio: img.width / img.height,
      width: img.width,
      height: img.height,
    };
    if (scaled.width > maxWidth) {
      scaled.width = maxWidth;
      scaled.height = scaled.width / scaled.ratio;
    }
    if (scaled.height > maxHeight) {
      scaled.height = maxHeight;
      scaled.width = scaled.height / scaled.ratio;
    }
    return scaled;
  },
  getTouchPos: (canvas, evt) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.touches[0].clientX - rect.left,
      y: evt.touches[0].clientY - rect.top,
    };
  },

};

module.exports = mouseEvent;
