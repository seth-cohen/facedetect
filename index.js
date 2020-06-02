'use strict';

import KalmanFilter from 'kalmanjs';

class Facedetect {
    constructor({
	video,
	canvasName = 'canvasOutput',
	drawOutput = false,
	cascadefile = 'haarcascade_frontalface_default.xml',
	outScale = {min: 0, max: 20},
	scaleStep = 1.2,
	numNeighbors = 5,
	faceDim = {min: 60, max: 150},
	faceScale = {min: 70, max: 140}
    }) {
	this.video = video;
	this.canvasName = canvasName;
	
	this.xf = new KalmanFilter();
	this.yf = new KalmanFilter();
	this.zf = new KalmanFilter();

	this.outScale = outScale;
	this.faceDim = faceDim;
	this.faceScale = faceScale;
	this.pos = new Vec3({x: 0, y: 0, z: 0});

	// CV related
	this.cascadeFile = cascadefile;
	this.classifier;
	this.cap;
	this.src;
	this.dst;
	this.gray;

	// face detect
	this.faces;
	this.scaleStep = scaleStep;
	this.numNeighbors = numNeighbors;

	this.minFaceSize;
	this.maxFaceSize;

	this.draw = drawOutput;
	this.ready = false;
    }

    init = () => {
	this.cap = new cv.VideoCapture(this.video)
	this.classifier = new cv.CascadeClassifier();

	createFileFromUrl(this.cascadeFile, this.cascadeFile, () => {
	    this.classifier.load(this.cascadeFile);
	});

	this.minFaceSize = new cv.Size(this.faceDim.min, this.faceDim.min);
	this.maxFaceSize = new cv.Size(this.faceDim.max, this.faceDim.max);

	
	this.ready = true;
    }

    toggle = () => {
	this.running = !this.running;
    }

    setState = (running) => {
	this.running = running;
	if (this.running) {
	    this.src = new cv.Mat(this.video.height, this.video.width, cv.CV_8UC4);
	    this.dst = new cv.Mat(this.video.height, this.video.width, cv.CV_8UC4);
	    this.gray = new cv.Mat();
	    this.faces = new cv.RectVector();
	} else {
	    this.src.delete();
	    this.dst.delete();
	    this.gray.delete();
	    this.faces.delete();
	}
    }

    drawOutput = (shouldDraw) => {
	this.draw = shouldDraw;
    }

    run = () => {
	try {
	    if (!this.ready) {
		throw "Module has not been initialized!";
	    }

	    if (!this.running) {
		return;
	    }

	    // start processing
	    this.cap.read(this.src);
	    this.src.copyTo(this.dst);
	    cv.cvtColor(this.dst, this.gray, cv.COLOR_RGBA2GRAY, 0);

	    // Detect faces
	    this.classifier.detectMultiScale(
		this.gray,
		this.faces,
		this.scaleStep,
		this.numNeighbors,
		0,
		this.minFaceSize,
		this.maxFaceSize
	    );

	    // Face information
	    let face;
	    if (this.faces.size() > 0) {
		face = this.faces.get(0);
		this.xf.filter(
		    mapValue(
			face.x, 0, this.video.width - face.width, this.outScale.min, this.outScale.max, true
		    )
		);
		this.yf.filter(
		    mapValue(
			face.y, 0, this.video.height - face.height, this.outScale.min, this.outScale.max, true
		    )
		);
		this.zf.filter(
		    mapValue(
			face.width, this.faceScale.min, this.faceScale.max, this.outScale.min, this.outScale.max
		    )
		);

		this.pos.set(this.xf.x, this.yf.x, this.zf.x);
	    }

	    if (this.draw) {
		if (face !== undefined) {
		    
		    let point1 = new cv.Point(face.x, face.y);
		    let point2 = new cv.Point(face.x + face.width, face.y + face.height);
		    
		    cv.rectangle(this.dst, point1, point2, [255, 0, 0, 255]);
		}
		cv.imshow(this.canvasName, this.dst);
	    }
	} catch (err) {
	    console.log("Unknown error running facedetect! " + err);
	} finally {
	    return this.pos;
	}
    }

    getFacePosition = () => {
	return this.pos;
    }
}


class Vec3 {
    constructor({x, y, z}) {
	this.x = x != null ? x : 0;
	this.y = y != null ? y : 0;
	this.z = z != null ? z : 0;
    }

    set = (x, y, z) => {
	this.x = x;
	this.y = y;
	this.z = z;
    }
}


function createFileFromUrl(path, url, callback) {
    let request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function(ev) {
	if (request.readyState === 4) {
	    if (request.status === 200) {
		let data = new Uint8Array(request.response);
		cv.FS_createDataFile('/', path, data, true, false, false);
		callback();
	    } else {
		self.printError('Failed to load ' + url + ' status: ' + request.status);
	    }
	}
    };
    request.send();
};

function mapValue(inValue, inMin, inMax, outMin, outMax, invert=false) {
    let out = ((inValue - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    if (invert) {
	out = outMax - out;
    }
    
    return out;
}

export {
    Facedetect
}
