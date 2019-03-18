/* eslint-disable */
/* Simple JavaScript Inheritance
   *
   */
// Inspired by base2 and Prototype
const start = () => {
  (() => {
    let initializing = false,
      fnTest = /xyz/.test(function() { xyz; }) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    this.Class = function() {
    };

    // Create a new Class that inherits from this class
    Class.extend = function(prop) {
      const _super = this.prototype;

      // Instantiate a base class (but only create the instance,
      // don't run the init constructor)
      initializing = true;
      const prototype = new this();
      initializing = false;

      // Copy the properties over onto the new prototype
      for (const name in prop) {
        // Check if we're overwriting an existing function
        prototype[name] = typeof prop[name] === 'function'
        && typeof _super[name] === 'function' && fnTest.test(prop[name])
          ? (function(name, fn) {
            return function() {
              const tmp = this._super;

              // Add a new ._super() method that is the same method
              // but on the super-class
              this._super = _super[name];

              // The method only need to be bound temporarily, so we
              // remove it when we're done executing
              const ret = fn.apply(this, arguments);
              this._super = tmp;

              return ret;
            };
          }(name, prop[name]))
          : prop[name];
      }

      // The dummy class constructor
      function Class() {
        // All construction is actually done in the init method
        if (!initializing && this.init) this.init.apply(this, arguments);
      }

      // Populate our constructed prototype object
      Class.prototype = prototype;

      // Enforce the constructor to be what we expect
      Class.prototype.constructor = Class;

      // And make this class extendable
      Class.extend = arguments.callee;

      return Class;
    };
  })();


  // ###################################################################
  // shims
  //
  // ###################################################################
  (function() {
    const requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
  }());

  (function() {
    if (!window.performance.now) {
      window.performance.now = (!Date.now) ? function() { return new Date().getTime(); }
        : function() { return Date.now(); };
    }
  }());

  // ###################################################################
  // Constants
  //
  // ###################################################################
  const IS_CHROME = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  const CANVAS_WIDTH = 640;
  const CANVAS_HEIGHT = 640;
  const SPRITE_SHEET_SRC = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAEACAYAAAADRnAGAAACGUlEQVR42u3aSQ7CMBAEQIsn8P+/hiviAAK8zFIt5QbELiTHmfEYE3L9mZE9AAAAqAVwBQ8AAAD6THY5CgAAAKbfbPX3AQAAYBEEAADAuZrC6UUyfMEEAIBiAN8OePXnAQAAsLcmmKFPAQAAgHMbm+gbr3Sdo/LtcAAAANR6GywPAgBAM4D2JXAAABoBzBjA7AmlOx8AAEAzAOcDAADovTc4vQim6wUCABAYQG8QAADd4dPd2fRVYQAAANQG0B4HAABAawDnAwAA6AXgfAAAALpA2uMAAABwPgAAgPoAM9Ci/R4AAAD2dmqcEQIAIC/AiQGuAAYAAECcRS/a/cJXkUf2AAAAoBaA3iAAALrD+gIAAADY9baX/nwAAADNADwFAADo9YK0e5FMX/UFACA5QPSNEAAAAHKtCekmDAAAAADvBljtfgAAAGgMMGOrunvCy2uCAAAACFU6BwAAwF6AGQPa/XsAAADYB+B8AAAAtU+ItD4OAwAAAFVhAACaA0T7B44/BQAAANALwGMQAAAAADYO8If2+P31AgAAQN0SWbhFDwCAZlXgaO1xAAAA1FngnA8AACAeQPSNEAAAAM4CnC64AAAA4GzN4N9NSfgKEAAAAACszO26X8/X6BYAAAD0Anid8KcLAAAAAAAAAJBnwNEvAAAA9Jns1ygAAAAAAAAAAAAAAAAAAABAQ4COCENERERERERERBrnAa1sJuUVr3rsAAAAAElFTkSuQmCC';
  const LEFT_KEY = 37;
  const RIGHT_KEY = 39;
  const SHOOT_KEY = 32;
  const TEXT_BLINK_FREQ = 500;
  const PLAYER_CLIP_RECT = {
    x: 0,
    y: 204,
    w: 62,
    h: 32
  };
  const ALIEN_BOTTOM_ROW = [{
    x: 0,
    y: 0,
    w: 51,
    h: 34
  }, {
    x: 0,
    y: 102,
    w: 51,
    h: 34
  }];
  const ALIEN_MIDDLE_ROW = [{
    x: 0,
    y: 137,
    w: 50,
    h: 33
  }, {
    x: 0,
    y: 170,
    w: 50,
    h: 34
  }];
  const ALIEN_TOP_ROW = [{
    x: 0,
    y: 68,
    w: 50,
    h: 32
  }, {
    x: 0,
    y: 34,
    w: 50,
    h: 32
  }];
  const ALIEN_X_MARGIN = 40;
  const ALIEN_SQUAD_WIDTH = 11 * ALIEN_X_MARGIN;


  // ###################################################################
  // Utility functions & classes
  //
  // ###################################################################
  function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }

  function valueInRange(value, min, max) {
    return (value <= max) && (value >= min);
  }

  function checkRectCollision(A, B) {
    const xOverlap = valueInRange(A.x, B.x, B.x + B.w)
      || valueInRange(B.x, A.x, A.x + A.w);

    const yOverlap = valueInRange(A.y, B.y, B.y + B.h)
      || valueInRange(B.y, A.y, A.y + A.h);
    return xOverlap && yOverlap;
  }

  const Point2D = Class.extend({
    init: function(x, y) {
      this.x = (typeof x === 'undefined') ? 0 : x;
      this.y = (typeof y === 'undefined') ? 0 : y;
    },

    set: function(x, y) {
      this.x = x;
      this.y = y;
    }
  });

  const Rect = Class.extend({
    init: function(x, y, w, h) {
      this.x = (typeof x === 'undefined') ? 0 : x;
      this.y = (typeof y === 'undefined') ? 0 : y;
      this.w = (typeof w === 'undefined') ? 0 : w;
      this.h = (typeof h === 'undefined') ? 0 : h;
    },

    set: function(x, y, w, h) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
    }
  });


  // ###################################################################
  // Globals
  //
  // ###################################################################
  let canvas = null;
  let ctx = null;
  let spriteSheetImg = null;
  let bulletImg = null;
  let keyStates = null;
  let prevKeyStates = null;
  let lastTime = 0;
  let player = null;
  let aliens = [];
  let particleManager = null;
  let updateAlienLogic = false;
  let alienDirection = -1;
  let alienYDown = 0;
  let alienCount = 0;
  let wave = 1;
  let hasGameStarted = false;


  // ###################################################################
  // Entities
  //
  // ###################################################################
  const BaseSprite = Class.extend({
    init: function(img, x, y) {
      this.img = img;
      this.position = new Point2D(x, y);
      this.scale = new Point2D(1, 1);
      this.bounds = new Rect(x, y, this.img.width, this.img.height);
      this.doLogic = true;
    },

    update: function(dt) {
    },

    _updateBounds: function() {
      this.bounds.set(this.position.x, this.position.y, ~~(0.5 + this.img.width * this.scale.x), ~~(0.5 + this.img.height * this.scale.y));
    },

    _drawImage: function() {
      ctx.drawImage(this.img, this.position.x, this.position.y);
    },

    draw: function(resized) {
      this._updateBounds();

      this._drawImage();
    }
  });

  const SheetSprite = BaseSprite.extend({
    init: function(sheetImg, clipRect, x, y) {
      this._super(sheetImg, x, y);
      this.clipRect = clipRect;
      this.bounds.set(x, y, this.clipRect.w, this.clipRect.h);
    },

    update: function(dt) {
    },

    _updateBounds: function() {
      const w = ~~(0.5 + this.clipRect.w * this.scale.x);
      const h = ~~(0.5 + this.clipRect.h * this.scale.y);
      this.bounds.set(this.position.x - w / 2, this.position.y - h / 2, w, h);
    },

    _drawImage: function() {
      ctx.save();
      ctx.transform(this.scale.x, 0, 0, this.scale.y, this.position.x, this.position.y);
      ctx.drawImage(this.img, this.clipRect.x, this.clipRect.y, this.clipRect.w, this.clipRect.h, ~~(0.5 + -this.clipRect.w * 0.5), ~~(0.5 + -this.clipRect.h * 0.5), this.clipRect.w, this.clipRect.h);
      ctx.restore();
    },

    draw: function(resized) {
      this._super(resized);
    }
  });

  const Player = SheetSprite.extend({
    init: function() {
      this._super(spriteSheetImg, PLAYER_CLIP_RECT, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 70);
      this.scale.set(0.85, 0.85);
      this.lives = 3;
      this.xVel = 0;
      this.bullets = [];
      this.bulletDelayAccumulator = 0;
      this.score = 0;
    },

    reset: function() {
      this.lives = 3;
      this.score = 0;
      this.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 70);
    },

    shoot: function() {
      const bullet = new Bullet(this.position.x, this.position.y - this.bounds.h / 2, 1, 1000);
      this.bullets.push(bullet);
    },

    handleInput: function() {
      if (isKeyDown(LEFT_KEY)) {
        this.xVel = -175;
      }
      else if (isKeyDown(RIGHT_KEY)) {
        this.xVel = 175;
      }
      else { this.xVel = 0; }

      if (wasKeyPressed(SHOOT_KEY)) {
        if (this.bulletDelayAccumulator > 0.5) {
          this.shoot();
          this.bulletDelayAccumulator = 0;
        }
      }
    },

    updateBullets: function(dt) {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        let bullet = this.bullets[i];
        if (bullet.alive) {
          bullet.update(dt);
        }
        else {
          this.bullets.splice(i, 1);
          bullet = null;
        }
      }
    },

    update: function(dt) {
      // update time passed between shots
      this.bulletDelayAccumulator += dt;

      // apply x vel
      this.position.x += this.xVel * dt;

      // cap player position in screen bounds
      this.position.x = clamp(this.position.x, this.bounds.w / 2, CANVAS_WIDTH - this.bounds.w / 2);
      this.updateBullets(dt);
    },

    draw: function(resized) {
      this._super(resized);

      // draw bullets
      for (let i = 0, len = this.bullets.length; i < len; i++) {
        const bullet = this.bullets[i];
        if (bullet.alive) {
          bullet.draw(resized);
        }
      }
    }
  });

  var Bullet = BaseSprite.extend({
    init: function(x, y, direction, speed) {
      this._super(bulletImg, x, y);
      this.direction = direction;
      this.speed = speed;
      this.alive = true;
    },

    update: function(dt) {
      this.position.y -= (this.speed * this.direction) * dt;

      if (this.position.y < 0) {
        this.alive = false;
      }
    },

    draw: function(resized) {
      this._super(resized);
    }
  });

  const Enemy = SheetSprite.extend({
    init: function(clipRects, x, y) {
      this._super(spriteSheetImg, clipRects[0], x, y);
      this.clipRects = clipRects;
      this.scale.set(0.5, 0.5);
      this.alive = true;
      this.onFirstState = true;
      this.stepDelay = 1; // try 2 secs to start with...
      this.stepAccumulator = 0;
      this.doShoot - false;
      this.bullet = null;
    },

    toggleFrame: function() {
      this.onFirstState = !this.onFirstState;
      this.clipRect = (this.onFirstState) ? this.clipRects[0] : this.clipRects[1];
    },

    shoot: function() {
      this.bullet = new Bullet(this.position.x, this.position.y + this.bounds.w / 2, -1, 500);
    },

    update: function(dt) {
      this.stepAccumulator += dt;

      if (this.stepAccumulator >= this.stepDelay) {
        if (this.position.x < this.bounds.w / 2 + 20 && alienDirection < 0) {
          updateAlienLogic = true;
        }
        if (alienDirection === 1 && this.position.x > CANVAS_WIDTH - this.bounds.w / 2 - 20) {
          updateAlienLogic = true;
        }
        if (this.position.y > CANVAS_WIDTH - 50) {
          reset();
        }

        const fireTest = Math.floor(Math.random() * (this.stepDelay + 1));
        if (getRandomArbitrary(0, 1000) <= 5 * (this.stepDelay + 1)) {
          this.doShoot = true;
        }
        this.position.x += 10 * alienDirection;
        this.toggleFrame();
        this.stepAccumulator = 0;
      }
      this.position.y += alienYDown;

      if (this.bullet !== null && this.bullet.alive) {
        this.bullet.update(dt);
      }
      else {
        this.bullet = null;
      }
    },

    draw: function(resized) {
      this._super(resized);
      if (this.bullet !== null && this.bullet.alive) {
        this.bullet.draw(resized);
      }
    }
  });

  const ParticleExplosion = Class.extend({
    init: function() {
      this.particlePool = [];
      this.particles = [];
    },

    draw: function() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];
        particle.moves++;
        particle.x += particle.xunits;
        particle.y += particle.yunits + (particle.gravity * particle.moves);
        particle.life--;

        if (particle.life <= 0) {
          if (this.particlePool.length < 100) {
            this.particlePool.push(this.particles.splice(i, 1));
          }
          else {
            this.particles.splice(i, 1);
          }
        }
        else {
          ctx.globalAlpha = (particle.life) / (particle.maxLife);
          ctx.fillStyle = particle.color;
          ctx.fillRect(particle.x, particle.y, particle.width, particle.height);
          ctx.globalAlpha = 1;
        }
      }
    },

    createExplosion: function(x, y, color, number, width, height, spd, grav, lif) {
      for (let i = 0; i < number; i++) {
        const angle = Math.floor(Math.random() * 360);
        const speed = Math.floor(Math.random() * spd / 2) + spd;
        const life = Math.floor(Math.random() * lif) + lif / 2;
        const radians = angle * Math.PI / 180;
        const xunits = Math.cos(radians) * speed;
        const yunits = Math.sin(radians) * speed;

        if (this.particlePool.length > 0) {
          const tempParticle = this.particlePool.pop();
          tempParticle.x = x;
          tempParticle.y = y;
          tempParticle.xunits = xunits;
          tempParticle.yunits = yunits;
          tempParticle.life = life;
          tempParticle.color = color;
          tempParticle.width = width;
          tempParticle.height = height;
          tempParticle.gravity = grav;
          tempParticle.moves = 0;
          tempParticle.alpha = 1;
          tempParticle.maxLife = life;
          this.particles.push(tempParticle);
        }
        else {
          this.particles.push({
            x: x,
            y: y,
            xunits: xunits,
            yunits: yunits,
            life: life,
            color: color,
            width: width,
            height: height,
            gravity: grav,
            moves: 0,
            alpha: 1,
            maxLife: life
          });
        }
      }
    }
  });


  // ###################################################################
  // Initialization functions
  //
  // ###################################################################
  function initCanvas() {
    // create our canvas and context
    canvas = document.getElementById('game-canvas').className = 'has-error';
    ctx = canvas.getContext('2d');

    // turn off image smoothing
    setImageSmoothing(false);

    // create our main sprite sheet img
    spriteSheetImg = new Image();
    spriteSheetImg.src = SPRITE_SHEET_SRC;
    preDrawImages();

    // add event listeners and initially resize
    window.addEventListener('resize', resize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  function preDrawImages() {
    const canvas = drawIntoCanvas(2, 8, function(ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    });
    bulletImg = new Image();
    bulletImg.src = canvas.toDataURL();
  }

  function setImageSmoothing(value) {
    ctx.imageSmoothingEnabled = value;
    ctx.mozImageSmoothingEnabled = value;
    ctx.oImageSmoothingEnabled = value;
    ctx.webkitImageSmoothingEnabled = value;
    ctx.msImageSmoothingEnabled = value;
  }

  function initGame() {
    dirtyRects = [];
    aliens = [];
    player = new Player();
    particleManager = new ParticleExplosion();
    setupAlienFormation();
    drawBottomHud();
  }

  function setupAlienFormation() {
    alienCount = 0;
    for (let i = 0, len = 5 * 11; i < len; i++) {
      const gridX = (i % 11);
      const gridY = Math.floor(i / 11);
      var clipRects;
      switch (gridY) {
        case 0:
        case 1:
          clipRects = ALIEN_BOTTOM_ROW;
          break;
        case 2:
        case 3:
          clipRects = ALIEN_MIDDLE_ROW;
          break;
        case 4:
          clipRects = ALIEN_TOP_ROW;
          break;
      }
      aliens.push(new Enemy(clipRects, (CANVAS_WIDTH / 2 - ALIEN_SQUAD_WIDTH / 2) + ALIEN_X_MARGIN / 2 + gridX * ALIEN_X_MARGIN, CANVAS_HEIGHT / 3.25 - gridY * 40));
      alienCount++;
    }
  }

  function reset() {
    aliens = [];
    setupAlienFormation();
    player.reset();
  }

  function init() {
    initCanvas();
    keyStates = [];
    prevKeyStates = [];
    resize();
  }


  // ###################################################################
  // Helpful input functions
  //
  // ###################################################################
  function isKeyDown(key) {
    return keyStates[key];
  }

  function wasKeyPressed(key) {
    return !prevKeyStates[key] && keyStates[key];
  }


  // ###################################################################
  // Drawing & Update functions
  //
  // ###################################################################
  function updateAliens(dt) {
    if (updateAlienLogic) {
      updateAlienLogic = false;
      alienDirection = -alienDirection;
      alienYDown = 25;
    }

    for (let i = aliens.length - 1; i >= 0; i--) {
      let alien = aliens[i];
      if (!alien.alive) {
        aliens.splice(i, 1);
        alien = null;
        alienCount--;
        if (alienCount < 1) {
          wave++;
          setupAlienFormation();
        }
        return;
      }

      alien.stepDelay = ((alienCount * 20) - (wave * 10)) / 1000;
      if (alien.stepDelay <= 0.05) {
        alien.stepDelay = 0.05;
      }
      alien.update(dt);

      if (alien.doShoot) {
        alien.doShoot = false;
        alien.shoot();
      }
    }
    alienYDown = 0;
  }

  function resolveBulletEnemyCollisions() {
    const bullets = player.bullets;

    for (let i = 0, len = bullets.length; i < len; i++) {
      const bullet = bullets[i];
      for (let j = 0, alen = aliens.length; j < alen; j++) {
        const alien = aliens[j];
        if (checkRectCollision(bullet.bounds, alien.bounds)) {
          alien.alive = bullet.alive = false;
          particleManager.createExplosion(alien.position.x, alien.position.y, 'white', 70, 5, 5, 3, 0.15, 50);
          player.score += 25;
        }
      }
    }
  }

  function resolveBulletPlayerCollisions() {
    for (let i = 0, len = aliens.length; i < len; i++) {
      const alien = aliens[i];
      if (alien.bullet !== null && checkRectCollision(alien.bullet.bounds, player.bounds)) {
        if (player.lives === 0) {
          hasGameStarted = false;
        }
        else {
          alien.bullet.alive = false;
          particleManager.createExplosion(player.position.x, player.position.y, 'green', 100, 8, 8, 6, 0.001, 40);
          player.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 70);
          player.lives--;
          break;
        }
      }
    }
  }

  function resolveCollisions() {
    resolveBulletEnemyCollisions();
    resolveBulletPlayerCollisions();
  }

  function updateGame(dt) {
    player.handleInput();
    prevKeyStates = keyStates.slice();
    player.update(dt);
    updateAliens(dt);
    resolveCollisions();
  }

  function drawIntoCanvas(width, height, drawFunc) {
    const canvas = document.getElementById('game-canvas').className = 'has-error';
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawFunc(ctx);
    return canvas;
  }

  function fillText(text, x, y, color, fontSize) {
    if (typeof color !== 'undefined') ctx.fillStyle = color;
    if (typeof fontSize !== 'undefined') ctx.font = `${fontSize}px Play`;
    ctx.fillText(text, x, y);
  }

  function fillCenteredText(text, x, y, color, fontSize) {
    const metrics = ctx.measureText(text);
    fillText(text, x - metrics.width / 2, y, color, fontSize);
  }

  function fillBlinkingText(text, x, y, blinkFreq, color, fontSize) {
    if (~~(0.5 + Date.now() / blinkFreq) % 2) {
      fillCenteredText(text, x, y, color, fontSize);
    }
  }

  function drawBottomHud() {
    ctx.fillStyle = '#02ff12';
    ctx.fillRect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 2);
    fillText(`${player.lives} x `, 10, CANVAS_HEIGHT - 7.5, 'white', 20);
    ctx.drawImage(spriteSheetImg, player.clipRect.x, player.clipRect.y, player.clipRect.w,
      player.clipRect.h, 45, CANVAS_HEIGHT - 23, player.clipRect.w * 0.5,
      player.clipRect.h * 0.5);
    fillText('CREDIT: ', CANVAS_WIDTH - 115, CANVAS_HEIGHT - 7.5);
    fillCenteredText(`SCORE: ${player.score}`, CANVAS_WIDTH / 2, 20);
    fillBlinkingText('00', CANVAS_WIDTH - 25, CANVAS_HEIGHT - 7.5, TEXT_BLINK_FREQ);
  }

  function drawAliens(resized) {
    for (let i = 0; i < aliens.length; i++) {
      const alien = aliens[i];
      alien.draw(resized);
    }
  }

  function drawGame(resized) {
    player.draw(resized);
    drawAliens(resized);
    particleManager.draw();
    drawBottomHud();
  }

  function drawStartScreen() {
    fillCenteredText('Space Invaders', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2.75, '#FFFFFF', 36);
    fillBlinkingText('Press enter to play!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 500, '#FFFFFF', 36);
  }

  function animate() {
    const now = window.performance.now();
    let dt = now - lastTime;
    if (dt > 100) dt = 100;

    if (wasKeyPressed(13) && !hasGameStarted) {
      initGame();
      hasGameStarted = true;
    }

    if (hasGameStarted) {
      updateGame(dt / 1000);
    }


    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (hasGameStarted) {
      drawGame(false);
    }
    else {
      drawStartScreen();
    }
    lastTime = now;
    requestAnimationFrame(animate);
  }


  // ###################################################################
  // Event Listener functions
  //
  // ###################################################################
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // calculate the scale factor to keep a correct aspect ratio
    const scaleFactor = Math.min(w / CANVAS_WIDTH, h / CANVAS_HEIGHT);

    if (IS_CHROME) {
      canvas.width = CANVAS_WIDTH * scaleFactor;
      canvas.height = CANVAS_HEIGHT * scaleFactor;
      setImageSmoothing(false);
      ctx.transform(scaleFactor, 0, 0, scaleFactor, 0, 0);
    }
    else {
      // resize the canvas css properties
      canvas.style.width = `${CANVAS_WIDTH * scaleFactor}px`;
      canvas.style.height = `${CANVAS_HEIGHT * scaleFactor}px`;
    }
  }

  function onKeyDown(e) {
    e.preventDefault();
    keyStates[e.keyCode] = true;
  }

  function onKeyUp(e) {
    e.preventDefault();
    keyStates[e.keyCode] = false;
  }


  // ###################################################################
  // Start game!
  //
  // ###################################################################

  init();
  animate();
};

export default start;
