var takeSnapshotUI = createClickFeedbackUI();

var video;
var takePhotoButton;
var toggleFullScreenButton;
var switchCameraButton;
var amountOfCameras = 0;
var currentFacingMode = 'environment';
var urlCreator;
var imageUrl;
var pict = document.getElementById("cap");

// this function counts the amount of video inputs
// it replaces DetectRTC that was previously implemented.
function deviceCount() {
  return new Promise(function (resolve) {
    var videoInCount = 0;

    navigator.mediaDevices
      .enumerateDevices()
      .then(function (devices) {
        devices.forEach(function (device) {
          if (device.kind === 'video') {
            device.kind = 'videoinput';
          }

          if (device.kind === 'videoinput') {
            videoInCount++;
            console.log('videocam: ' + device.label);
          }
        });

        resolve(videoInCount);
      })
      .catch(function (err) {
        console.log(err.name + ': ' + err.message);
        resolve(0);
      });
  });
}

document.addEventListener('DOMContentLoaded', function (event) {
  // check if mediaDevices is supported
  if (
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    navigator.mediaDevices.enumerateDevices
  ) {
    // first we call getUserMedia to trigger permissions
    // we need this before deviceCount, otherwise Safari doesn't return all the cameras
    // we need to have the number in order to display the switch front/back button
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: true,
      })
      .then(function (stream) {
        stream.getTracks().forEach(function (track) {
          track.stop();
        });

        deviceCount().then(function (deviceCount) {
          amountOfCameras = deviceCount;

          // init the UI and the camera stream
          initCameraUI();
          initCameraStream();
        });
      })
      .catch(function (error) {
        //https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
        if (error === 'PermissionDeniedError') {
          alert('Permission denied. Please refresh and give permission.');
        }

        console.error('getUserMedia() error: ', error);
      });
  } else {
    alert(
      'Mobile camera is not supported by browser, or there is no camera detected/connected',
    );
  }
});

function initCameraUI() {
  video = document.getElementById('video');

  takePhotoButton = document.getElementById('takePhotoButton');
  toggleFullScreenButton = document.getElementById('toggleFullScreenButton');
  switchCameraButton = document.getElementById('switchCameraButton');
  downloadButton = document.getElementById('downloadButton');
  toggleFullScreenButton.style.display = 'none';
  // https://developer.mozilla.org/nl/docs/Web/HTML/Element/button
  // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_button_role

  takePhotoButton.addEventListener('click', function () {
    takeSnapshotUI();
    takeSnapshot();
  });

  // -- fullscreen part

  function fullScreenChange() {
    if (screenfull.isFullscreen) {
      toggleFullScreenButton.setAttribute('aria-pressed', true);
    } else {
      toggleFullScreenButton.setAttribute('aria-pressed', false);
    }
  }

  if (screenfull.isEnabled) {
    screenfull.on('change', fullScreenChange);

    toggleFullScreenButton.style.display = 'none';

    // set init values
    fullScreenChange();

    toggleFullScreenButton.addEventListener('click', function () {
      screenfull.toggle(document.getElementById('container')).then(function () {
        console.log(
          'Fullscreen mode: ' +
            (screenfull.isFullscreen ? 'enabled' : 'disabled'),
        );
      });
    });
  } else {
    console.log("iOS doesn't support fullscreen (yet)");
  }

  // -- switch camera part
  if (amountOfCameras > 1) {
    switchCameraButton.style.display = 'block';

    switchCameraButton.addEventListener('click', function () {
      if (currentFacingMode === 'environment') currentFacingMode = 'user';
      else currentFacingMode = 'environment';

      initCameraStream();
    });
  }

  // Listen for orientation changes to make sure buttons stay at the side of the
  // physical (and virtual) buttons (opposite of camera) most of the layout change is done by CSS media queries
  // https://www.sitepoint.com/introducing-screen-orientation-api/
  // https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientation
  window.addEventListener(
    'orientationchange',
    function () {
      // iOS doesn't have screen.orientation, so fallback to window.orientation.
      // screen.orientation will
      if (screen.orientation) angle = screen.orientation.angle;
      else angle = window.orientation;

      var guiControls = document.getElementById('gui_controls').classList;
      var vidContainer = document.getElementById('vid_container').classList;

      if (angle == 270 || angle == -90) {
        guiControls.add('left');
        vidContainer.add('left');
      } else {
        if (guiControls.contains('left')) guiControls.remove('left');
        if (vidContainer.contains('left')) vidContainer.remove('left');
      }

      //0   portrait-primary
      //180 portrait-secondary device is down under
      //90  landscape-primary  buttons at the right
      //270 landscape-secondary buttons at the left
    },
    false,
  );

  downloadButton.addEventListener('click', function () {
    
  });
}

// https://github.com/webrtc/samples/blob/gh-pages/src/content/devices/input-output/js/main.js
function initCameraStream() {
  // stop any active streams in the window
  if (window.stream) {
    window.stream.getTracks().forEach(function (track) {
      console.log(track);
      track.stop();
    });
  }

  // we ask for a square resolution, it will cropped on top (landscape)
  // or cropped at the sides (landscape)
  var size = 1280;
  var widthSize = 1920;
  var heightSize = 1080;
  
  var constraints = {
    audio: false,
    video: {
      width: { ideal: size },
      height: { ideal: size },
      //width: { min: 1024, ideal: window.innerWidth, max: 1920 },
      //height: { min: 776, ideal: window.innerHeight, max: 1080 },
      facingMode: currentFacingMode,
      //facingMode: "user",
    },
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(handleSuccess)
    .catch(handleError);

  function handleSuccess(stream) {
    window.stream = stream; // make stream available to browser console
    video.srcObject = stream;

    if (constraints.video.facingMode) {
      if (constraints.video.facingMode === 'environment') {
        switchCameraButton.setAttribute('aria-pressed', true);
      } else {
        switchCameraButton.setAttribute('aria-pressed', false);
      }
    }

    const track = window.stream.getVideoTracks()[0];
    const settings = track.getSettings();
    str = JSON.stringify(settings, null, 4);
    console.log('settings ' + str);
  }

  function handleError(error) {
    console.error('getUserMedia() error: ', error);
  }
}

  function takeSnapshot(input = null) {
    
    if (input == null){
      var canvas = document.createElement('canvas');
      var frame = document.getElementById("frame");

      var width = video.videoWidth;
      var height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;

      context = canvas.getContext('2d');
      if (currentFacingMode == "environment"){                                
        context.drawImage(video, -170, 0, width * 1.25, height);                                  
      }else{
        context.save(); 
        context.scale(-1, 1); 
        //context.drawImage(video, (width * -1) - 170, 0, width * 1.25, height);

        if (screen.availHeight > screen.availWidth) {
          context.drawImage(video, (width * -1), 0, width, height);
        }
        else if (screen.availHeight < screen.availWidth) {
          if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
            context.drawImage(video, (width * -1) + -170, -170, width * 1.25, height * 1.25);
          }
          else {
            context.drawImage(video, (width * -1) + -180, -170, width * 1.30, height * 1.25);
          }
        }
        context.restore();
      }
      context.drawImage(frame, 0, 0, width, height);
      // polyfil if needed https://github.com/blueimp/JavaScript-Canvas-to-Blob
      // https://developers.google.com/web/fundamentals/primers/promises
      // https://stackoverflow.com/questions/42458849/access-blob-value-outside-of-canvas-toblob-async-function
      function getCanvasBlob(canvas) {
        return new Promise(function (resolve, reject) {
          canvas.toBlob(function (blob) {
            resolve(blob);
          }, 'image/jpeg');
        });
      }

      // some API's (like Azure Custom Vision) need a blob with image data
      getCanvasBlob(canvas).then(function (blob) {
        // do something with the image blob
        urlCreator = window.URL || window.webkitURL;
        imageUrl = urlCreator.createObjectURL(blob);
        document.querySelector("#capture").src = imageUrl;
        document.getElementById("imageURL").href = imageUrl;  
      });
    }
    else {
      var frame = document.getElementById("frame");
      var canvas = document.createElement('canvas');
      var image = new Image;
      var uploadImageUrl;
      var uploadUrlCreator = window.URL || window.webkitURL;       

      var width = 1080;
      var height = 1920;
      canvas.width = width;
      canvas.height = height;

      context = canvas.getContext('2d');
      
      document.getElementById("captured").style.display = "block";
      document.getElementById("controls").style.display = "none";
      document.getElementById("buttons").style.display = "block";
      document.getElementById("captureCanvas").style.display = "none";
      document.getElementById("uploadCanvas").style.display = "block";
      
      if (input.files && input.files[0]) {
        var reader = new FileReader();
        
        reader.onload = (e) => $('#fileImage').attr('src', e.target.result);      
        reader.readAsDataURL(input.files[0]);
      }

      image.src = URL.createObjectURL(input.files[0]);
      image.onload = function() {
        context.drawImage(image, -180, 0, width * 1.25, height);
        context.drawImage(frame, 0, 0, width, height);   
        function getCanvasBlob(canvas) {
          return new Promise(function (resolve, reject) {
            canvas.toBlob(function (blob) {
              resolve(blob);
            }, 'image/jpeg');
          });
        }

        // some API's (like Azure Custom Vision) need a blob with image data
        getCanvasBlob(canvas).then(function (blob) {
          // do something with the image blob          
          uploadImageUrl = uploadUrlCreator.createObjectURL(blob);
          document.querySelector("#fileImageCapture").src = uploadImageUrl;
          document.getElementById("imgURL").href = uploadImageUrl;  
        });         
      }                  
    }
}

// https://hackernoon.com/how-to-use-javascript-closures-with-confidence-85cd1f841a6b
// closure; store this in a variable and call the variable as function
// eg. var takeSnapshotUI = createClickFeedbackUI();
// takeSnapshotUI();

function createClickFeedbackUI() {
  // in order to give feedback that we actually pressed a button.
  // we trigger a almost black overlay
  var overlay = document.getElementById('video_overlay'); //.style.display;

  // sound feedback
  var sndClick = new Howl({ src: ['snd/click.mp3'] });

  var overlayVisibility = false;
  var timeOut = 80;

  function setFalseAgain() {
    overlayVisibility = false;
    overlay.style.display = 'none';
  }

  return function () {
    if (overlayVisibility == false) {
      sndClick.play();
      overlayVisibility = true;
      overlay.style.display = 'block';
      setTimeout(setFalseAgain, timeOut);
    }
  };
}
