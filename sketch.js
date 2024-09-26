let cols, rows;
let flowField;  // Array to hold the flow field vectors
let particles = [];  // Array to hold particles that will follow the flow

let scl = 20;  // Scale of the flow field cells
let zoff = 0;  // Z-axis offset for Perlin noise to create animation
let inc = 0.1;  // Increment for Perlin noise
let opacityChangeSpeed = 0.003;  // Slower flicker speed for stars
let followDistance = 100;  // Distance for particles to follow mouse

let maxSpeedFast = 5;  // Fast speed when clicking the mouse
let maxSpeedSlow = 2;  // Default slow speed
let isFast = false;  // Track whether particles are moving fast or slow

function setup() {
  createCanvas(800, 600);
  cols = floor(width / scl);
  rows = floor(height / scl);

  flowField = new Array(cols * rows);  // Create flow field array

  // Create more particles (increased to 3000 for more lines)
  for (let i = 0; i < 3000; i++) {
    particles[i] = new Particle();
  }

  background(20, 24, 82);  // Set night sky color
}

function draw() {
  // Draw background sky color
  background(20, 24, 82, 10);  // The '10' transparency creates a trail effect

  // Generate the flow field
  let yoff = 0;
  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols;
      let angle = noise(xoff, yoff, zoff) * TWO_PI * 2;  // Use Perlin noise to generate angles
      let v = p5.Vector.fromAngle(angle);  // Create a vector from the angle
      v.setMag(0.5);  // Set magnitude of vector (flow speed)
      flowField[index] = v;  // Store the vector in the flow field array
      xoff += inc;
    }
    yoff += inc;
  }
  zoff += 0.01;  // Change z offset over time to create movement

  // Update and display particles (flowing lines)
  for (let i = 0; i < particles.length; i++) {
    particles[i].follow(flowField);
    particles[i].mouseInteraction();  // Add mouse interaction to follow mouse within range
    particles[i].update();
    particles[i].show();
    particles[i].edges();  // Wrap particles around screen edges
  }

  // Draw fewer, smaller stars with slower flicker
  drawStars();
  drawMoon();

  // Draw the foreground (cypress tree and village)
  drawForeground();
}

// Particle class to represent individual particles that follow the flow field
class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));  // Initial position
    this.vel = createVector(0, 0);  // Initial velocity
    this.acc = createVector(0, 0);  // Initial acceleration
    this.maxSpeed = maxSpeedSlow;  // Default slow speed
    this.prevPos = this.pos.copy();  // To draw lines from previous position
  }

  follow(vectors) {
    let x = floor(this.pos.x / scl);
    let y = floor(this.pos.y / scl);
    let index = x + y * cols;  // Find the index in the flow field array
    let force = vectors[index];  // Get the vector from the flow field
    this.applyForce(force);  // Apply the force to the particle
  }

  applyForce(force) {
    this.acc.add(force);  // Accumulate the force
  }

  update() {
    this.vel.add(this.acc);  // Update velocity based on acceleration
    this.vel.limit(this.maxSpeed);  // Limit the velocity based on current maxSpeed
    this.pos.add(this.vel);  // Update position based on velocity
    this.acc.mult(0);  // Reset acceleration to 0 after each frame
  }

  show() {
    stroke(255, 255, 150, 25);  // Starry night color with transparency
    strokeWeight(1);
    line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);  // Draw a line from previous position to current
    this.updatePrev();  // Update the previous position
  }

  updatePrev() {
    this.prevPos.x = this.pos.x;
    this.prevPos.y = this.pos.y;
  }

  edges() {
    // Wrap around the edges of the canvas
    if (this.pos.x > width) {
      this.pos.x = 0;
      this.updatePrev();
    }
    if (this.pos.x < 0) {
      this.pos.x = width;
      this.updatePrev();
    }
    if (this.pos.y > height) {
      this.pos.y = 0;
      this.updatePrev();
    }
    if (this.pos.y < 0) {
      this.pos.y = height;
      this.updatePrev();
    }
  }

  // Method to interact with the mouse: follow mouse if within range, else random flow
  mouseInteraction() {
    let mouseDist = dist(this.pos.x, this.pos.y, mouseX, mouseY);  // Calculate distance from particle to mouse

    if (mouseDist < followDistance) {  // If the distance is less than followDistance
      let mouseForce = p5.Vector.sub(createVector(mouseX, mouseY), this.pos);  // Calculate an attractive force towards the mouse
      mouseForce.setMag(0.5);  // Set the magnitude of the attraction
      this.applyForce(mouseForce);  // Apply the attractive force
    }
  }

  // Method to change the speed of the particle
  changeSpeed(newSpeed) {
    this.maxSpeed = newSpeed;  // Set the new maximum speed
  }
}

// Draw fewer, smaller stars with slow flicker effect
function drawStars() {
  noStroke();
  let flickerOpacity = map(sin(frameCount * opacityChangeSpeed), -1, 1, 150, 255);  // Sinusoidal opacity change

  fill(255, 255, 150, flickerOpacity);  // Apply dynamic opacity to stars
  for (let i = 0; i < 5; i++) {  // Reduce the number of stars to 5
    let x = random(width);
    let y = random(height / 2);  // Stars only in the upper half of the canvas
    let starSize = random(10, 20);  // Make stars smaller
    ellipse(x, y, starSize, starSize);
  }
}

// Draw the moon
function drawMoon() {
  fill(255, 255, 100);
  ellipse(width - 150, 100, 100, 100);  // Position the moon in the top-right corner
}

// Draw the foreground elements (cypress tree and village)
function drawForeground() {
  // Cypress tree
  fill(20, 20, 20);
  beginShape();
  vertex(100, height);
  vertex(130, height / 1.5);
  vertex(120, height / 2.5);
  vertex(140, height / 3);
  vertex(130, height / 5);
  vertex(150, height / 4);
  vertex(160, height / 2);
  vertex(180, height / 1.5);
  vertex(150, height);
  endShape(CLOSE);

  // Simple village houses
  fill(80, 80, 120);
  for (let i = 0; i < 5; i++) {
    let houseWidth = random(40, 60);
    let houseHeight = random(40, 60);
    rect(400 + i * 60, height - houseHeight, houseWidth, houseHeight);
  }
}

// Toggle speed when mouse is clicked
function mousePressed() {
  isFast = !isFast;  // Toggle between fast and slow

  let newSpeed = isFast ? maxSpeedFast : maxSpeedSlow;  // Choose the new speed
  for (let i = 0; i < particles.length; i++) {
    particles[i].changeSpeed(newSpeed);  // Update each particle's speed
  }
}
