/**
 * Battle Effects Studio - RPGエフェクト生成システム v1.0
 */

class BattleEffectsStudio {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('effectCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.currentEnemy = 'slime';
        this.enemyHP = 100;
        this.maxHP = 100;
        this.comboCount = 0;
        this.isAnimating = false;
        
        // Settings
        this.intensity = 7;
        this.speed = 1.0;
        this.soundEnabled = true;
        
        // Effects
        this.particles = [];
        this.screenEffects = [];
        this.statusEffects = [];
        
        // Audio
        this.audioContext = null;
        this.masterGain = null;
        
        // Animation
        this.animationId = null;
        this.lastTime = 0;
        
        // Attack definitions
        this.attacks = {
            // Physical attacks
            slash: { 
                name: '斬撃', 
                damage: [80, 120], 
                duration: 800, 
                critical: 0.2,
                color: '#ff6b35',
                sound: 'slash'
            },
            stab: { 
                name: '突き', 
                damage: [60, 100], 
                duration: 500, 
                critical: 0.3,
                color: '#f39c12',
                sound: 'stab'
            },
            punch: { 
                name: '殴打', 
                damage: [40, 80], 
                duration: 400, 
                critical: 0.15,
                color: '#e74c3c',
                sound: 'punch'
            },
            arrow: { 
                name: '矢撃', 
                damage: [70, 110], 
                duration: 1200, 
                critical: 0.25,
                color: '#8fbc8f',
                sound: 'arrow'
            },
            
            // Magic attacks
            fireball: { 
                name: '火球', 
                damage: [100, 150], 
                duration: 1500, 
                critical: 0.2,
                color: '#ff4500',
                sound: 'fire'
            },
            ice: { 
                name: '氷結', 
                damage: [90, 130], 
                duration: 1800, 
                critical: 0.18,
                color: '#00bfff',
                sound: 'ice'
            },
            lightning: { 
                name: '雷撃', 
                damage: [120, 160], 
                duration: 600, 
                critical: 0.3,
                color: '#ffff00',
                sound: 'lightning'
            },
            wind: { 
                name: '風刃', 
                damage: [70, 110], 
                duration: 1000, 
                critical: 0.22,
                color: '#98fb98',
                sound: 'wind'
            },
            earth: { 
                name: '地震', 
                damage: [150, 200], 
                duration: 2500, 
                critical: 0.15,
                color: '#8b4513',
                sound: 'earth'
            },
            holy: { 
                name: '聖光', 
                damage: [200, 300], 
                duration: 3000, 
                critical: 0.25,
                color: '#ffd700',
                sound: 'holy'
            },
            
            // Special attacks
            poison: { 
                name: '毒霧', 
                damage: [50, 80], 
                duration: 4000, 
                critical: 0.1,
                color: '#9acd32',
                sound: 'poison'
            },
            explosion: { 
                name: '爆発', 
                damage: [180, 250], 
                duration: 1200, 
                critical: 0.2,
                color: '#ff8c00',
                sound: 'explosion'
            },
            meteor: { 
                name: 'メテオ', 
                damage: [300, 500], 
                duration: 5000, 
                critical: 0.3,
                color: '#dc143c',
                sound: 'meteor'
            },
            ultimate: { 
                name: '究極技', 
                damage: [500, 999], 
                duration: 8000, 
                critical: 0.5,
                color: '#9932cc',
                sound: 'ultimate'
            }
        };
        
        this.init();
    }

    init() {
        console.log('⚔️ Battle Effects Studio v1.0 初期化中...');
        
        this.setupCanvas();
        this.setupEventListeners();
        this.initAudio();
        this.updateUI();
        this.startAnimation();
        
        console.log('✅ Battle Effects Studio 準備完了！');
    }

    setupCanvas() {
        const resize = () => {
            const container = document.querySelector('.battle-stage');
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        };
        
        resize();
        window.addEventListener('resize', resize);
    }

    setupEventListeners() {
        // Enemy selection
        document.querySelectorAll('.enemy-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.enemy-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.currentEnemy = card.dataset.enemy;
                this.switchEnemy(this.currentEnemy);
            });
        });

        // Attack buttons
        document.querySelectorAll('.attack-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const attackType = btn.dataset.attack;
                if (!this.isAnimating) {
                    this.executeAttack(attackType);
                }
            });
        });

        // Controls
        document.getElementById('intensity').addEventListener('input', (e) => {
            this.intensity = parseInt(e.target.value);
            document.getElementById('intensityValue').textContent = this.intensity;
        });

        document.getElementById('speed').addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = this.speed.toFixed(1) + 'x';
        });

        document.getElementById('randomBtn').addEventListener('click', () => {
            this.executeRandomAttack();
        });

        document.getElementById('soundBtn').addEventListener('click', () => {
            this.toggleSound();
        });

        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('resetCombo').addEventListener('click', () => {
            this.resetCombo();
        });
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }

    startAnimation() {
        const animate = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            this.update(deltaTime);
            this.render();

            this.animationId = requestAnimationFrame(animate);
        };
        
        animate(0);
    }

    update(deltaTime) {
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime * 0.001;
            particle.y += particle.vy * deltaTime * 0.001;
            particle.life -= particle.decay;
            
            if (particle.gravity) {
                particle.vy += 300 * deltaTime * 0.001;
            }
            
            return particle.life > 0;
        });

        // Update screen effects
        this.screenEffects = this.screenEffects.filter(effect => {
            effect.life -= effect.decay;
            return effect.life > 0;
        });
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw particles
        this.particles.forEach(particle => this.drawParticle(particle));
        
        // Draw screen effects
        this.screenEffects.forEach(effect => this.drawScreenEffect(effect));
    }

    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.life;
        
        if (particle.type === 'spark') {
            // Draw spark effect
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size
            );
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                particle.x - particle.size,
                particle.y - particle.size,
                particle.size * 2,
                particle.size * 2
            );
        } else if (particle.type === 'magic') {
            // Draw magic particle
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 20;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Draw normal particle
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(
                particle.x - particle.size / 2,
                particle.y - particle.size / 2,
                particle.size,
                particle.size
            );
        }
        
        this.ctx.restore();
    }

    drawScreenEffect(effect) {
        this.ctx.save();
        this.ctx.globalAlpha = effect.life;
        
        if (effect.type === 'lightning') {
            this.drawLightning(effect);
        } else if (effect.type === 'shockwave') {
            this.drawShockwave(effect);
        }
        
        this.ctx.restore();
    }

    drawLightning(effect) {
        this.ctx.strokeStyle = effect.color;
        this.ctx.lineWidth = 5;
        this.ctx.shadowColor = effect.color;
        this.ctx.shadowBlur = 20;
        
        this.ctx.beginPath();
        this.ctx.moveTo(effect.x1, effect.y1);
        this.ctx.lineTo(effect.x2, effect.y2);
        this.ctx.stroke();
    }

    drawShockwave(effect) {
        this.ctx.strokeStyle = effect.color;
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = effect.color;
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    switchEnemy(enemyType) {
        const enemyImage = document.getElementById('enemyImage');
        enemyImage.className = `enemy-image ${enemyType}`;
        
        // Reset HP
        this.enemyHP = this.maxHP;
        this.updateHPBar();
        
        // Remove any status effects
        document.getElementById('enemyStatus').innerHTML = '';
    }

    executeAttack(attackType) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        const attack = this.attacks[attackType];
        const duration = (attack.duration / this.speed);
        
        // Calculate damage
        const baseDamage = Math.floor(Math.random() * (attack.damage[1] - attack.damage[0]) + attack.damage[0]);
        const intensityMultiplier = this.intensity / 5;
        const damage = Math.floor(baseDamage * intensityMultiplier);
        const isCritical = Math.random() < attack.critical;
        const finalDamage = isCritical ? Math.floor(damage * 1.5) : damage;
        
        // Update UI info
        this.updateAttackInfo(attack, finalDamage, isCritical, duration);
        
        // Play sound
        this.playAttackSound(attack.sound, isCritical);
        
        // Execute visual effects
        this.createAttackEffect(attackType, attack, isCritical);
        
        // Apply damage
        setTimeout(() => {
            this.applyDamage(finalDamage, isCritical);
            this.comboCount++;
            this.updateComboDisplay();
            
            setTimeout(() => {
                this.isAnimating = false;
            }, 500);
        }, duration * 0.6);
        
        // Show audio visualizer
        this.showAudioVisualizer(duration);
    }

    executeRandomAttack() {
        const attackTypes = Object.keys(this.attacks);
        const randomAttack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
        this.executeAttack(randomAttack);
    }

    createAttackEffect(attackType, attack, isCritical) {
        const enemyContainer = document.getElementById('enemyContainer');
        const rect = enemyContainer.getBoundingClientRect();
        const stageRect = document.querySelector('.battle-stage').getBoundingClientRect();
        
        const targetX = rect.left - stageRect.left + rect.width / 2;
        const targetY = rect.top - stageRect.top + rect.height / 2;
        
        switch(attackType) {
            case 'slash':
                this.createSlashEffect(targetX, targetY, attack.color, isCritical);
                break;
            case 'fireball':
                this.createFireballEffect(targetX, targetY, attack.color, isCritical);
                break;
            case 'lightning':
                this.createLightningEffect(targetX, targetY, attack.color, isCritical);
                break;
            case 'ice':
                this.createIceEffect(targetX, targetY, attack.color, isCritical);
                break;
            case 'explosion':
                this.createExplosionEffect(targetX, targetY, attack.color, isCritical);
                break;
            case 'meteor':
                this.createMeteorEffect(targetX, targetY, attack.color, isCritical);
                break;
            case 'ultimate':
                this.createUltimateEffect(targetX, targetY, attack.color, isCritical);
                break;
            default:
                this.createGenericEffect(targetX, targetY, attack.color, isCritical);
        }
        
        // Screen shake and flash
        this.createScreenShake();
        this.createFlashEffect(attack.color);
    }

    createSlashEffect(x, y, color, isCritical) {
        // Slash line effect
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const slashLine = {
                    type: 'slash',
                    x1: x - 100,
                    y1: y - 50 + i * 30,
                    x2: x + 100,
                    y2: y + 50 + i * 30,
                    color: color,
                    life: 1,
                    decay: 0.02
                };
                this.screenEffects.push(slashLine);
            }, i * 50);
        }
        
        // Spark particles
        this.createSparkParticles(x, y, color, isCritical ? 50 : 30);
    }

    createFireballEffect(x, y, color, isCritical) {
        // Fire particles
        for (let i = 0; i < (isCritical ? 100 : 60); i++) {
            const angle = (Math.PI * 2 * i) / (isCritical ? 100 : 60);
            const speed = 100 + Math.random() * 200;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: i % 3 === 0 ? '#ff4500' : i % 3 === 1 ? '#ff6347' : '#ffd700',
                life: 1,
                decay: 0.01,
                type: 'magic',
                gravity: false
            });
        }
        
        // Central explosion
        this.createShockwaveEffect(x, y, color);
    }

    createLightningEffect(x, y, color, isCritical) {
        // Lightning bolts
        for (let i = 0; i < (isCritical ? 8 : 5); i++) {
            setTimeout(() => {
                const lightning = {
                    type: 'lightning',
                    x1: x + (Math.random() - 0.5) * 200,
                    y1: 0,
                    x2: x + (Math.random() - 0.5) * 100,
                    y2: y,
                    color: color,
                    life: 1,
                    decay: 0.05
                };
                this.screenEffects.push(lightning);
            }, i * 50);
        }
        
        // Electric particles
        this.createSparkParticles(x, y, color, isCritical ? 40 : 25);
    }

    createIceEffect(x, y, color, isCritical) {
        // Ice crystals
        for (let i = 0; i < (isCritical ? 80 : 50); i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                size: 2 + Math.random() * 4,
                color: i % 2 === 0 ? '#00bfff' : '#b0e0e6',
                life: 1,
                decay: 0.008,
                type: 'magic',
                gravity: true
            });
        }
        
        // Add freeze status effect
        this.addStatusEffect('❄️', 3000);
    }

    createExplosionEffect(x, y, color, isCritical) {
        // Explosion particles
        for (let i = 0; i < (isCritical ? 150 : 100); i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 300;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 8,
                color: i % 3 === 0 ? '#ff8c00' : i % 3 === 1 ? '#ff4500' : '#ffd700',
                life: 1,
                decay: 0.015,
                type: 'spark',
                gravity: true
            });
        }
        
        // Multiple shockwaves
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createShockwaveEffect(x, y, color);
            }, i * 200);
        }
    }

    createMeteorEffect(x, y, color, isCritical) {
        // Meteor impact
        const meteorSize = isCritical ? 150 : 100;
        
        // Create massive explosion
        for (let i = 0; i < (isCritical ? 200 : 150); i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 150 + Math.random() * 400;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 100,
                size: 5 + Math.random() * 10,
                color: i % 3 === 0 ? '#dc143c' : i % 3 === 1 ? '#ff4500' : '#ff8c00',
                life: 1,
                decay: 0.005,
                type: 'spark',
                gravity: true
            });
        }
        
        // Multiple large shockwaves
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createLargeShockwaveEffect(x, y, color);
            }, i * 300);
        }
    }

    createUltimateEffect(x, y, color, isCritical) {
        // Rainbow ultimate effect
        const colors = ['#ff0000', '#ff8c00', '#ffd700', '#00ff00', '#00bfff', '#8a2be2'];
        
        // Massive particle explosion
        for (let i = 0; i < 300; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 500;
            const colorIndex = Math.floor(Math.random() * colors.length);
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 12,
                color: colors[colorIndex],
                life: 1,
                decay: 0.003,
                type: 'magic',
                gravity: Math.random() > 0.5
            });
        }
        
        // Ultimate shockwave sequence
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.createLargeShockwaveEffect(x, y, colors[i % colors.length]);
            }, i * 200);
        }
        
        // Extended screen effects
        this.createExtendedFlashEffect();
    }

    createGenericEffect(x, y, color, isCritical) {
        // Generic particle effect
        for (let i = 0; i < (isCritical ? 60 : 40); i++) {
            const angle = (Math.PI * 2 * i) / (isCritical ? 60 : 40);
            const speed = 80 + Math.random() * 120;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                color: color,
                life: 1,
                decay: 0.015,
                type: 'magic',
                gravity: false
            });
        }
    }

    createSparkParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 160;
            
            this.particles.push({
                x: x + (Math.random() - 0.5) * 50,
                y: y + (Math.random() - 0.5) * 50,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 3,
                color: color,
                life: 1,
                decay: 0.02,
                type: 'spark',
                gravity: false
            });
        }
    }

    createShockwaveEffect(x, y, color) {
        const shockwave = {
            type: 'shockwave',
            x: x,
            y: y,
            radius: 0,
            maxRadius: 150,
            color: color,
            life: 1,
            decay: 0.02
        };
        
        const expandShockwave = () => {
            if (shockwave.radius < shockwave.maxRadius) {
                shockwave.radius += 5;
                requestAnimationFrame(expandShockwave);
            }
        };
        
        this.screenEffects.push(shockwave);
        expandShockwave();
    }

    createLargeShockwaveEffect(x, y, color) {
        const shockwave = {
            type: 'shockwave',
            x: x,
            y: y,
            radius: 0,
            maxRadius: 300,
            color: color,
            life: 1,
            decay: 0.015
        };
        
        const expandShockwave = () => {
            if (shockwave.radius < shockwave.maxRadius) {
                shockwave.radius += 8;
                requestAnimationFrame(expandShockwave);
            }
        };
        
        this.screenEffects.push(shockwave);
        expandShockwave();
    }

    createScreenShake() {
        const enemySprite = document.getElementById('enemySprite');
        enemySprite.classList.add('shake');
        setTimeout(() => {
            enemySprite.classList.remove('shake');
        }, 500);
    }

    createFlashEffect(color) {
        const flashOverlay = document.getElementById('flashOverlay');
        flashOverlay.style.background = color;
        flashOverlay.classList.add('active');
        setTimeout(() => {
            flashOverlay.classList.remove('active');
        }, 100);
    }

    createExtendedFlashEffect() {
        const flashOverlay = document.getElementById('flashOverlay');
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                flashOverlay.style.background = i % 2 === 0 ? '#ffffff' : '#9932cc';
                flashOverlay.classList.add('active');
                setTimeout(() => {
                    flashOverlay.classList.remove('active');
                }, 150);
            }, i * 200);
        }
    }

    applyDamage(damage, isCritical) {
        this.enemyHP = Math.max(0, this.enemyHP - damage);
        this.updateHPBar();
        this.showDamageNumber(damage, isCritical);
        
        // Enemy hit animation
        const enemyImage = document.getElementById('enemyImage');
        enemyImage.classList.add('hit-flash');
        setTimeout(() => {
            enemyImage.classList.remove('hit-flash');
        }, 300);
        
        // Check if enemy is defeated
        if (this.enemyHP <= 0) {
            this.defeatEnemy();
        }
    }

    showDamageNumber(damage, isCritical) {
        const damageNumber = document.createElement('div');
        damageNumber.className = `damage-number ${isCritical ? 'critical' : ''}`;
        damageNumber.textContent = damage;
        
        const enemyContainer = document.getElementById('enemyContainer');
        const rect = enemyContainer.getBoundingClientRect();
        const stageRect = document.querySelector('.battle-stage').getBoundingClientRect();
        
        damageNumber.style.left = (rect.left - stageRect.left + rect.width / 2) + 'px';
        damageNumber.style.top = (rect.top - stageRect.top + rect.height / 2) + 'px';
        
        document.getElementById('damageNumbers').appendChild(damageNumber);
        
        setTimeout(() => {
            damageNumber.remove();
        }, 2000);
    }

    addStatusEffect(icon, duration) {
        const statusEffect = document.createElement('div');
        statusEffect.className = 'status-effect';
        statusEffect.textContent = icon;
        statusEffect.style.left = Math.random() * 200 + 'px';
        statusEffect.style.top = Math.random() * 200 + 'px';
        
        document.getElementById('enemyStatus').appendChild(statusEffect);
        
        setTimeout(() => {
            statusEffect.remove();
        }, duration);
    }

    defeatEnemy() {
        const enemyImage = document.getElementById('enemyImage');
        enemyImage.classList.add('fade-out');
        
        setTimeout(() => {
            this.enemyHP = this.maxHP;
            this.updateHPBar();
            enemyImage.classList.remove('fade-out');
        }, 1000);
    }

    updateHPBar() {
        const hpFill = document.getElementById('hpFill');
        const percentage = (this.enemyHP / this.maxHP) * 100;
        hpFill.style.width = percentage + '%';
        
        // Change color based on HP
        if (percentage > 60) {
            hpFill.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
        } else if (percentage > 30) {
            hpFill.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
        } else {
            hpFill.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
        }
    }

    updateAttackInfo(attack, damage, isCritical, duration) {
        document.getElementById('attackType').textContent = attack.name;
        document.getElementById('duration').textContent = (duration / 1000).toFixed(1) + '秒';
        document.getElementById('damage').textContent = damage;
        document.getElementById('critical').textContent = isCritical ? 'YES' : 'NO';
    }

    updateComboDisplay() {
        document.getElementById('comboCount').textContent = this.comboCount;
    }

    resetCombo() {
        this.comboCount = 0;
        this.updateComboDisplay();
    }

    updateUI() {
        this.updateHPBar();
        this.updateComboDisplay();
    }

    showAudioVisualizer(duration) {
        const visualizer = document.getElementById('audioVisualizer');
        visualizer.classList.add('active');
        
        setTimeout(() => {
            visualizer.classList.remove('active');
        }, duration);
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = document.querySelector('#soundBtn .btn-icon');
        icon.textContent = this.soundEnabled ? '🔊' : '🔇';
        
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(
                this.soundEnabled ? 0.3 : 0,
                this.audioContext.currentTime
            );
        }
    }

    toggleFullscreen() {
        const battleStage = document.querySelector('.battle-stage');
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            battleStage.requestFullscreen();
        }
    }

    playAttackSound(soundType, isCritical) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const baseVolume = isCritical ? 0.5 : 0.3;
        
        switch(soundType) {
            case 'slash':
                this.playSlashSound(now, baseVolume);
                break;
            case 'fire':
                this.playFireSound(now, baseVolume);
                break;
            case 'lightning':
                this.playLightningSound(now, baseVolume);
                break;
            case 'explosion':
                this.playExplosionSound(now, baseVolume);
                break;
            case 'ultimate':
                this.playUltimateSound(now, baseVolume);
                break;
            default:
                this.playGenericSound(now, baseVolume);
        }
    }

    playSlashSound(now, volume) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playFireSound(now, volume) {
        // Fire crackling sound
        const noiseBuffer = this.createNoiseBuffer(0.5);
        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        source.buffer = noiseBuffer;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.Q.setValueAtTime(10, now);
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        source.start(now);
        source.stop(now + 0.5);
    }

    playLightningSound(now, volume) {
        // Lightning crack
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playExplosionSound(now, volume) {
        // Explosion bass
        const bassOsc = this.audioContext.createOscillator();
        const bassGain = this.audioContext.createGain();
        
        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);
        
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(80, now);
        bassOsc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        
        bassGain.gain.setValueAtTime(volume, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        bassOsc.start(now);
        bassOsc.stop(now + 0.3);
    }

    playUltimateSound(now, volume) {
        // Multi-layered ultimate sound
        const frequencies = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(volume, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 1);
            
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 1);
        });
    }

    playGenericSound(now, volume) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }

    createNoiseBuffer(duration) {
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
}

// Initialize application
let battleEffects;

document.addEventListener('DOMContentLoaded', () => {
    console.log('⚔️ Battle Effects Studio - RPGエフェクト生成システム v1.0');
    battleEffects = new BattleEffectsStudio();
});

// Export for debugging
window.BattleEffectsStudio = BattleEffectsStudio;