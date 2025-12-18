let handPose;
let video;
let hands = [];
let stars = [];
let prevSize = 0;

let explodeSound;

function preload() {
  handPose = ml5.handPose();

  soundFormats('mp3', 'ogg');
  explodeSound = loadSound('assets/explote.mp3');
}

function setup() {
  createCanvas(640, 480);
  userStartAudio(); 

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  handPose.detectStart(video, gotHands);
}

function draw() {
  image(video, 0, 0, width, height);

  if (hands.length > 0) {
    let finger = hands[0].index_finger_tip;
    let thumb = hands[0].thumb_tip;

    let centerX = (finger.x + thumb.x) / 2;
    let centerY = (finger.y + thumb.y) / 2;
    let size = dist(finger.x, finger.y, thumb.x, thumb.y);

    drawStar(centerX, centerY, size / 2, size, 5);

    if (prevSize <= 150 && size > 150) {
      let cantidad = int(map(size, 150, 200, 10, 25));
      for (let i = 0; i < cantidad; i++) {
        stars.push(new SmallStar(centerX, centerY));
      }

      // sonido
      if (explodeSound && explodeSound.isLoaded()) {
        explodeSound.play();
      }
    }

    prevSize = size;
  }

  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].update();
    stars[i].show();
    if (stars[i].finished()) {
      stars.splice(i, 1);
    }
  }
}

function gotHands(results) {
  hands = results;
}

function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  fill(255, 255, 0, 200);
  noStroke();
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

class SmallStar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    let speed = random(1, 4);
    let dir = random(TWO_PI);
    this.vx = cos(dir) * speed;
    this.vy = sin(dir) * speed;
    this.alpha = 255;
    this.size = random(5, 15);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.02;
    this.alpha -= 4;
  }

  show() {
    push();
    fill(255, 255, 255, this.alpha);
    noStroke();
    drawStar(this.x, this.y, this.size / 2, this.size, 5);
    pop();
  }

  finished() {
    return this.alpha <= 0;
  }
}