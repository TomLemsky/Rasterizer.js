var canvas;
var context;
var camerapos = [0,0,-10000];
var cameraangle = [0,0,0];
var playervelocity = [0,0,0];
var focallength = 1000;

window.onload = function() {
	canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');

    context.translate(0.5*canvas.width, 0.5*canvas.height);

	context.lineWidth = 2;
	context.fillStyle = context.strokeStyle = 'black';

    context.beginPath();
	context.arc(0,0, 200, 0, 2 * Math.PI);
	context.stroke();

    animationLoop(); // start animation loop

    // handle key presses
    document.onkeydown = function(event) {
        if(event.keyCode=="38" || event.keyCode=="87"){ // up or w key
            camerapos[2] +=   800*Math.cos(cameraangle[1]);  // move in z direction
            camerapos[0] += - 800*Math.sin(cameraangle[1]);  // move in x direction
        }else if(event.keyCode=="40" || event.keyCode=="83"){ // down or s key
            camerapos[2] -=   800*Math.cos(cameraangle[1]);  // move in z direction
            camerapos[0] -= - 800*Math.sin(cameraangle[1]);  // move in x direction
        }else if(event.keyCode=="37" || event.keyCode=="65"){ // left or a key
            camerapos[2] -=   800*Math.sin(cameraangle[1]);  // move in z direction
            camerapos[0] -=   800*Math.cos(cameraangle[1]);  // move in x direction
        }else if(event.keyCode=="39" || event.keyCode=="68"){ // right or d key
            camerapos[2] +=   800*Math.sin(cameraangle[1]);  // move in z direction
            camerapos[0] +=   800*Math.cos(cameraangle[1]);  // move in x direction
        }else if(event.keyCode=="32"){ // space bar
            playervelocity[1] = -200;
        }
        //drawFrame();
    }

    // cross-browser pointer lock
    canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.mozRequestPointerLock;

    document.exitPointerLock = document.exitPointerLock ||
                           document.mozExitPointerLock;

    canvas.onclick = function() {
    canvas.requestPointerLock();
    };


}

// Pointer Lock Source: https://mdn.github.io/dom-examples/pointer-lock/app.js
// Hook pointer lock state change events for different browsers
document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

function lockChangeAlert() {
  if (document.pointerLockElement === canvas ||
      document.mozPointerLockElement === canvas) {
    console.log('The pointer lock status is now locked');
    document.addEventListener("mousemove", updateCameraAngles, false);
  } else {
    console.log('The pointer lock status is now unlocked');
    document.removeEventListener("mousemove", updateCameraAngles, false);
  }
}

function updateCameraAngles(e) {
  cameraangle[0] += e.movementY * Math.PI / 2000;
  cameraangle[1] -= e.movementX * Math.PI / 2000;
  //console.log(e.movementX,e.movementY);
  //console.log(cameraangle);
  //drawFrame();
}

function addArrays(x,y){
    if(x.length != y.length) console.log("Arrays of different length: ",x,y);
    return map = x.map((e,i) => e + y[i]);
}

function subtractArrays(x,y){
    if(x.length != y.length) console.log("Arrays of different length: ",x,y);
    return map = x.map((e,i) => e - y[i]);
}

function multArrays(x,y){
    if(x.length != y.length) console.log("Arrays of different length: ",x,y);
    return x.map((e,i) => e * y[i]);
}

function multArrayConstant(x,c){
    return x.map(e => e * c);
}

// rotate point on x axis
function rotatePointX(p,angle){
    return [p[0],
            Math.cos(angle)*p[1]-Math.sin(angle)*p[2],
            Math.sin(angle)*p[1]+Math.cos(angle)*p[2]];
}

// rotate point on y axis
function rotatePointY(p,angle){
    return [Math.cos(angle)*p[0]+Math.sin(angle)*p[2],
            p[1],
           -Math.sin(angle)*p[0]+Math.cos(angle)*p[2]];
}

// rotate point on z axis
function rotatePointZ(p,angle){
    return [Math.cos(angle)*p[0]-Math.sin(angle)*p[1],
            Math.sin(angle)*p[0]+Math.cos(angle)*p[1],
            p[2]];
}

// rotate point in XYZ directions according to array angles
function rotatePointXYZ(p,angles){
    return rotatePointX(rotatePointY(rotatePointZ(p,angles[2]),angles[1]),angles[0]);
}

// HorizontalPlane: takes a 3 dimensional position and a width and a height (in z direction)
function HorizontalPlane(pos,w,h) {
    this.pos = pos;
    this.w = w;
    this.h = h;
}

HorizontalPlane.prototype.getPolygons = function() {
    var topleft     = this.pos;
    var topright    = [this.pos[0]+this.w,this.pos[1],this.pos[2]];
    var bottomleft  = [this.pos[0]       ,this.pos[1],this.pos[2]+this.h];
    var bottomright = [this.pos[0]+this.w,this.pos[1],this.pos[2]+this.h];
    return { "points": [topleft,topright,bottomright,bottomleft], "fillStyle": "black"};
}

HorizontalPlane.prototype.isAbove = function(xyz) {
    if(xyz[0] < this.pos[0]) return false;
    if(xyz[0] > this.pos[0] + this.w) return false;
    if(xyz[2] < this.pos[2]) return false;
    if(xyz[2] > this.pos[2] + this.h) return false;
    return (xyz[1] - (this.pos[1] -3000)) > -500;
}

function Cube(size, position, angles) {
	this.size = size;
    this.position = position;
    this.angles = angles;
    if(!this.angles) this.angles = [0,0,0];
    if(size.length!=3) console.log("Size is a array of integers indicating XYZ size");
    if(position.length!=3) console.log("Position is a array of integers indicating XYZ position");
    if(angles.length!=3) console.log("angles is a array of integers indicating XYZ orientation");
}

Cube.prototype.getPolygons = function() {

    var size = this.size;
    var position = this.position;
    var angles = this.angles;

    points = [[1,1,1],[-1,1,1],[-1,-1,1],[1,-1,1],
              [1,1,-1],[-1,1,-1],[-1,-1,-1],[1,-1,-1]];
    points = points.map(function(p){
        q =  rotatePointXYZ(p,angles);
        q[0] = q[0] * size[0] + position[0];
        q[1] = q[1] * size[1] + position[1];
        q[2] = q[2] * size[2] + position[2];
        return q;
    })

    // faces as indices into points
    faces = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,4,7,3],[1,5,6,2]];

    styles = ["red","blue","green","yellow","violet","orange"];

    result = [];

    for(i=0; i < faces.length; ++i){
        ps = [];
        for(j=0; j < faces[0].length; ++j){
            ps.push(points[faces[i][j]]);
        }
        result.push({ "points": ps, "fillStyle": styles[i]});
    }

    return result;

    //return faces.map(f => ({ "points": f.map(p => points[p])}));
}

// distance of a polygon to camera plane
function polygonDistance(p){
    return p.points.map(i => i[2]).reduce((a,b)=> a+b,0); // average z coordinate of polygon
    //return Math.min(...p.points.map(i => i[2]));
}




function animationLoop() {
    physicsLoop();
    drawFrame();
    requestAnimationFrame(animationLoop);
}

var timeOfLastFrame = window.performance.now();
var timeOfLastPhysics = window.performance.now();
var fps = 60;
var frameNumber=0;
var polygons;
var o_polys = false;
var colliders = [];

function physicsLoop(){
    var deltaT = window.performance.now() - timeOfLastPhysics;
    timeOfLastPhysics = window.performance.now();
    playervelocity[1] += 100 * deltaT/1000;
    camerapos[1] += playervelocity[1];
    if(camerapos[1]>0) camerapos[1]=0;
    for(var i=0; i<colliders.length; i++){
        if(colliders[i].isAbove(camerapos)){
           camerapos[1] = colliders[i].pos[1]-3000;
        }
    }
}

function drawFrame(){
    context.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);



    // var polygons =  [{ "points":[[100,100,5],[100,-100,5],[-100,0,5], [0,0,5]]},
    //              { "points":[[100,100,2],[100,-100,2],[-100,0,2]]},
    //              { "points":[[-50,-50,5],[-50, 150,5],[150,50,5]]}];
    var polygons =  [];

    var objects = [];

    if(!o_polys){
    for(var i=1; i<=25;i++){

    cu = new Cube([1000,1000,1000], [8000,4000,4000*i-16000], [Math.PI/8,Math.PI/8,-Math.PI/8]);
    objects.push(cu);

    cu2 = new Cube([1000,1000,1000], [-8000,-4000,4000*i-16000], [Math.PI/8,Math.PI/8,-Math.PI/8]);
    objects.push(cu2);

    cu2 = new Cube([1000,1000,1000], [8000,-4000,4000*i-16000], [Math.PI/8,Math.PI/8,-Math.PI/8]);
    objects.push(cu2);

    cu2 = new Cube([1000,1000,1000], [-8000,4000,4000*i-16000], [Math.PI/8,Math.PI/8,-Math.PI/8]);
    objects.push(cu2);
    }

    // hp = new HorizontalPlane([5000,-1000,4000], 10000, 10000);
    // objects.push(hp);
    // colliders.push(hp);
    //
    // hp = new HorizontalPlane([15000,-3000,4000], 10000, 10000);
    // objects.push(hp);
    // colliders.push(hp);

    // get polygon array for each object and then flatten
    o_polys = objects.map(o => o.getPolygons()).flat();
    }

    polygons = JSON.parse(JSON.stringify(o_polys)); //deep copy //polygons.concat(o_polys);

    // Camera transform (cameraposition, camera angle

    for(var i=0; i < polygons.length; i++){
        for(var j=0; j < polygons[i]["points"].length; j++){
            // add the camera position to every point
            polygons[i]["points"][j] = subtractArrays(polygons[i]["points"][j], camerapos);
            // rotate everything around the around camera pos
            polygons[i]["points"][j] = rotatePointX(rotatePointY(polygons[i]["points"][j], cameraangle[1]), cameraangle[0]);
        }
    }

    // sort polygons by closest point to origin
    // (using a framebuffer would be faster)
    polygons = polygons.sort((a,b) => polygonDistance(a)<polygonDistance(b));


    // draw polygons
    // TODO: vectorize this?
    polygons.forEach(function(t){

        p = t.points;
        if(p[0][2]<=0) return;  // skip polygons behind camera

        context.beginPath();
        context.moveTo((focallength * p[0][0])/p[0][2], (focallength * p[0][1])/p[0][2]); // project 3d to 2d
        for(i=1; i < p.length; ++i){
            if(p[i][2]<=0) return; // skip polygons behind camera
            context.lineTo((focallength * p[i][0])/p[i][2], (focallength * p[i][1])/p[i][2]); // project remaining points
        }
        context.closePath();

        if(t.fillStyle) {
            context.fillStyle = t.fillStyle;
            context.fill();
        }

        context.stroke();

    });
    frameNumber++;

    if(frameNumber%10==0) fps = Math.round(1000/(window.performance.now() - timeOfLastFrame));
    if(!fps) fps = 1000;
    timeOfLastFrame = window.performance.now();

    context.font = "30px Arial";
    context.fillStyle = "black";
    context.fillText("FPS: " + fps.toString(), -canvas.width/2.5, -canvas.height/2.5);
}
