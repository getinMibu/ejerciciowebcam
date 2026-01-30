let handPose;
let video;
let hands = [];
let stars = [];
let prevSize = 0;

let explodeSound;
let bouquet;

function preload() {
  handPose = ml5.handPose();
  soundFormats('mp3', 'ogg');
  explodeSound = loadSound('assets/explote.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight); // pantalla completa
  userStartAudio();

  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight); // video pantalla completa
  video.hide();

  handPose.detectStart(video, gotHands);

  // Crear ramo con muchas flores distribuidas en la parte baja
  bouquet = new Bouquet(width/2, height + 100); // raíz fuera de pantalla
}

function draw() {
  image(video, 0, 0, width, height);

  let size = 0;
  if (hands.length > 0) {
    let finger = hands[0].index_finger_tip;
    let thumb = hands[0].thumb_tip;
    size = dist(finger.x, finger.y, thumb.x, thumb.y);

    // Abrir/cerrar pétalos según gesto
    bouquet.setOpen(map(size, 50, 200, 0, 1));

    // Explosión de estrellas cuando está completamente abierta
    if (prevSize <= 150 && size > 150) {
      for (let f of bouquet.flowers) {
        let cantidad = int(random(8, 15));
        for (let i = 0; i < cantidad; i++) {
          stars.push(new SmallStar(f.x, f.y));
        }
      }
      if (explodeSound && explodeSound.isLoaded()) {
        explodeSound.play();
      }
    }
    prevSize = size;
  }

  bouquet.show();

  // Dibujar estrellas
  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].update();
    stars[i].show();
    if (stars[i].finished()) {
      stars.splice(i, 1);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}

function gotHands(results) {
  hands = results;
}

/* =========================
   RAMO DE FLORES
========================= */
class Bouquet {
  constructor(x, y) {
    this.rootX = x;
    this.rootY = y;
    this.flowers = [];

    // Generar varias flores con variaciones
    for (let i = 0; i < 12; i++) {
      let offsetX = map(i, 0, 11, -width/2 + 100, width/2 - 100);
      let offsetY = random(-250, -350);
      let vine = (i % 4 === 0); // algunas enredaderas
      this.flowers.push(new Flower(x + offsetX, y + offsetY, vine));
    }
  }

  setOpen(val) {
    for (let f of this.flowers) {
      f.setOpen(val);
    }
  }

  show() {
    for (let f of this.flowers) {
      f.showStem(this.rootX, this.rootY);
      f.show();
    }
  }
}

/* =========================
   FLOR
========================= */
class Flower {
  constructor(x, y, vine = false) {
    this.baseX = x;
    this.baseY = y;
    this.x = x;
    this.y = y;
    this.openFactor = 0;
    this.petals = int(random(5, 9)); // variación en número de pétalos
    this.size = random(40, 70);      // variación en tamaño
    this.vine = vine;
    this.colors = this.randomPalette(); // paleta aleatoria
    // movimiento orgánico
    this.offsetX = random(10, 25);
    this.offsetY = random(5, 15);
    this.speed = random(0.01, 0.03);
    this.rotationSpeed = random(0.005, 0.02); // giro de pétalos
  }

  randomPalette() {
    let palettes = [
      [[255, 100, 150], [255, 180, 200], [255, 220, 240]], // rosas
      [[200, 100, 255], [220, 180, 255], [240, 220, 255]], // violetas
      [[255, 200, 100], [255, 220, 180], [255, 240, 220]], // naranjas
      [[100, 200, 255], [150, 220, 255], [200, 240, 255]]  // azules
    ];
    return random(palettes);
  }

  setOpen(val) {
    this.openFactor = constrain(val, 0, 1);
  }

  showStem(rootX, rootY) {
    let swayX = sin(frameCount * this.speed) * this.offsetX;
    let swayY = cos(frameCount * this.speed) * this.offsetY;

    stroke(40, 120, 60);
    strokeWeight(6);
    noFill();

    if (this.vine) {
      // tallo curvado tipo enredadera
      bezier(rootX, rootY,
             rootX + 50, rootY - 150,
             this.baseX - 50 + swayX, this.baseY - 100 + swayY,
             this.baseX + swayX, this.baseY + swayY);
    } else {
      line(rootX, rootY, this.baseX + swayX, this.baseY + swayY);
    }

    // hojas
    fill(60, 180, 90, 200);
    noStroke();
    ellipse((rootX + this.baseX) / 2 - 30, (rootY + this.baseY) / 2, 50, 25);
    ellipse((rootX + this.baseX) / 2 + 30, (rootY + this.baseY) / 2 - 50, 50, 25);

    // actualizar posición animada
    this.x = this.baseX + swayX;
    this.y = this.baseY + swayY;
  }

  show() {
    push();
    translate(this.x, this.y);

    // pétalos distribuidos en círculo con rotación animada
    for (let i = 0; i < this.petals; i++) {
      let angle = TWO_PI / this.petals * i;
      push();
      rotate(angle + frameCount * this.rotationSpeed);

      for (let layer = 0; layer < this.colors.length; layer++) {
        let col = this.colors[layer];
        let alpha = 200 - layer * 60;
        let scale = this.openFactor * (1 - layer * 0.2);

        fill(col[0], col[1], col[2], alpha);
        noStroke();

        // pétalo tipo lágrima
        ellipse(0, -this.size * scale, this.size * 0.6 * scale, this.size * 1.4 * scale);
      }

      pop();
    }

    // centro amarillo
    fill(255, 220, 0, 220);
    ellipse(0, 0, this.size * 0.5 * this.openFactor);

    pop();
  }
}

/* =========================
   ESTRELLAS
========================= */
function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
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
    this.vy += 0.02;   // gravedad ligera
    this.alpha -= 4;   // se va desvaneciendo
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