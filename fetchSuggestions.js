// web worker for spell check suggestions
onmessage = function(e) {
  console.log(e);
  postMessage(workerResult);
}