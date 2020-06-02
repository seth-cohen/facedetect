# Facedetect
OpenCV based face detection/tracking library

## Requirements
- opencv.js
- haarcascade_frontalface_default.xml

## Building
To build both the production and development builds to `./build/facedetect.min.js` 
and `./build/facedetect.js`, respectively.

```bash
$ ./node_modules/.bin/webpack && NODE_ENV=development ./node_modules/.bin/webpack
```

## Usage
```html
<head>
	<script src="facedetect.min.js" type="text/javascript" ></script>
</head>
<body>
<video id="videoInput" width="240" height="240"></video>
<canvas id="canvasOutput" width="240" height="240"></canvas>

<script>
	// Configure the module to attempt to run at 60 FPS
	const FPS = 60;
	let framedetect;
	function processVideo() {
		try {
			let begin = Date.now();
			
			// Get the tracked position from the module
			let pos = facedetect.run();

			// Schedule the next detection frame
			let delay = 1000/FPS - (Date.now() - begin);
			setTimeout(processVideo, delay);
		} catch (err) {
			console.log(err);
		}
	};

	// Register callback for when OpenCV is loaded and initialized
	function opencvLoaded() {
		cv['onRuntimeInitialized'] = async () => {
			let video = document.getElementById('videoInput');
			const videoConstraints = {
				width: 240,
				height: 240
			}
			try {
				// Request permission to the user's webcam
				const stream = await navigator.mediaDevices.getUserMedia({ 
					video: videoConstraints, 
					audio: false 
				});
				
				// Attach the webcam to the `video` element
				video.srcObject = stream;
				video.play();

				// Configure and initialize a Facedetect object
				let facedetect = new fd.Facedetect({
					video,
					canvasName: 'canvasOutput',
					drawOutput: showOutput
				});
				facedetect.init();

			} catch (err) {
				console.log("An error occurred! " + err);
			}
		};
	}
</script>
<script async src="https://docs.opencv.org/master/opencv.js" onload="opencvLoaded();" type="text/javascript"></script>
```


### Configuration Options

| name         |                                                         | description                                                                                             |
|--------------|---------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| video        | `video` (required)                                      | `video` element that your webcam stream is running in                                                   |
| canvasName   | string (default: 'canvasOutput')                        | `id` of the canvas element to use for output if/when `drawOutput` option is set                         |
| drawOutput   | boolean (default: false)                                | Whether or not to draw the video feed into a `canvas` with the id `canvasName`                                                    |
| cascadefile  | string (default: 'haarcascade_frontalface_default.xml') | cascade file to use for feature detection                                                               |
| outScale     | {min: int, max: int} (default: {min: 0, max: 20})       | Output of position will be scaled to this range                                                         |
| faceDim      | {min: int, max: int} (default: {min: 60, max: 150})     | Range of face dimensions in pixels to be detected                                                       |
| faceScale    | {min: int, max: int} (default: {min: 70, max: 140})     | Range of face dimensions in pixels to correspond to outScale min/max for Z position                     |
| scaleStep    | float                                                   | see                    `openCV::detectMultiScale()` `scaleFactor` parameter                             |
| numNeighbors | int                                                     | see `openCV::detectMultiScale()` `numNeighbors` parameter (higher values provide more accurate results) |

### Methods
#### Facedetect(options)
Construct the `Facedetect` option (see Configuration)

---

#### init()
Initialize the Facedetect object classifier and other settings

--- 

#### run()
This method should be called every frame that you request face detection/tracking
information from the video feed.

Returns Vec3 ({x: <float>, y: <float>, z: <float>})

---

#### setState(boolean detect)
Sets the state of the object. When `detect` is `false`, the module is not
actively detecting faces, however `run()` will still return the last known position

---

#### drawOutput(boolean shouldDraw)
Whether or not the module should draw the input feed with faces bound by
rectangles in a `canvas` element with the id `canvasName`
