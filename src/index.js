import React from "react";
import ReactDOM from "react-dom";

// import "@tensorflow/tfjs-backend-cpu"; ====>>>>>>>>>>>>>for tfjs lite
// import * as tf from "@tensorflow/tfjs-core";
import * as tftasks from "@tensorflow-models/tasks";
// import * as tf from "@tensorflow/tfjs"; =====>>>>>>>>>>> we can use this for for tf graphmodel
// import { loadGraphModel } from "@tensorflow/tfjs-converter"; =======>>>>to load converted graph
import "./styles.css";

async function load_model() {
  const model = await tftasks.ObjectDetection.CustomModel.TFLite.load({
    model: "http://127.0.0.1:8080/model.tflite",
  });
  return model;
}
class App extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();

  componentDidMount() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
          },
        })
        .then((stream) => {
          window.stream = stream;
          this.videoRef.current.srcObject = stream;
          return new Promise((resolve, reject) => {
            this.videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          });
        });

      const modelPromise = load_model();

      Promise.all([modelPromise, webCamPromise])
        .then((values) => {
          this.detectFrame(this.videoRef.current, values[0]);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  detectFrame = async (video, model) => {
    const predections = await model.predict(video);
    this.buildDetectedObjects(predections);
    requestAnimationFrame(() => {
      this.detectFrame(video, model);
    });
  };

  buildDetectedObjects(result) {
    const detectionObjects = result.objects;
    for (let i = 0; i < Math.min(5, detectionObjects.length); i++) {
      const curObject = detectionObjects[i];
      const boundingBox = curObject.boundingBox;
      const name = curObject.className;
      const score = curObject.score;
      this.renderPredictions(
        boundingBox.originX,
        boundingBox.originY,
        boundingBox.width,
        boundingBox.height,
        name,
        score
      );
    }
  }

  renderPredictions = (left, top, w, h, name, score) => {
    const ctx = this.canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const x = top;
    const y = left;
    const width = w;
    const height = h;

    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    // Draw the bounding box.
    ctx.beginPath();
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.rect(x, y, width, height);
    ctx.stroke();

    // Draw the label background.
    ctx.fillStyle = "green";
    const textWidth = ctx.measureText(
      name + " " + (100 * score).toFixed(2) + "%"
    ).width;
    const textHeight = parseInt(font, 10); // base 10
    ctx.fillRect(x, y, textWidth + 4, textHeight + 4);

    // Draw the text last to ensure it's on top.
    ctx.fillStyle = "white";
    ctx.fillText(name + " " + (100 * score).toFixed(2) + "%", x, y);
  };

  render() {
    return (
      <div>
        <div className="App-header">
          <video
            width={640}
            height={480}
            autoPlay
            playsInline
            muted
            ref={this.videoRef}
            id="frame"
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 0,
              right: 0,
              textAlign: "center",
              zindex: 9,
              width: 640,
              height: 480,
            }}
          />
          <canvas
            ref={this.canvasRef}
            width={640}
            height={480}
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 0,
              right: 0,
              textAlign: "center",
              zindex: 8,
              width: 640,
              height: 480,
            }}
          />
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
