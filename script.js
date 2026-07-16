/**
 * RATH YATRA 2026 - FINAL PRODUCTION VERIFIED
 * Optimized for 60 FPS, Minimal Reflow, Memory Leak Free
 */

// Cache DOM Elements to avoid querying inside loops
const UI = {
    canvas: document.getElementById('particle-canvas'),
    ctx: document.getElementById('particle-canvas').getContext('2d', { alpha: true }),
    chariot: document.getElementById('chariot-container'),
    wheels: document.querySelectorAll('.wheel'),
    handle: document.getElementById('pull-handle'),
    ropeLine: document.getElementById('rope-line'),
    progBar: document.getElementById('progress-bar'),
    progText: document.getElementById('progress-text'),
    caption: document.getElementById('milestone-caption'),
    
    layers: {
        temple: document.getElementById('layer-temple'),
        clouds: document.getElementById('layer-clouds'),
        crowd: document.getElementById('layer-banners')
    },
    
    celebSection: document.getElementById('celebration')
};

let cw, ch;
let resizeTimer;
function resize() { 
    cw = UI.canvas.width = window.innerWidth; 
    ch = UI.canvas.height = window.innerHeight; 
}
window.addEventListener('resize', () => {
    // Debounce resize to prevent layout thrashing
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
});
resize();

// --- Production Audio Engine ---
const AudioEngine = {
    bg: document.getElementById('sfx-bg'),
    bell: document.getElementById('sfx-bell'),
    cheer: document.getElementById('sfx-cheer'),
    conch: document.getElementById('sfx-conch'),
    muted: false,
    musicStarted: false,
    init() {
        // Button removed, sound always on. Force unmute.
        [this.bg, this.bell, this.cheer, this.conch].forEach(a => { if(a) a.muted = false; });
    },
    playMusic() {
        if(!this.muted && !this.musicStarted && this.bg) {
            this.musicStarted = true;
            let p = this.bg.play();
            if(p!==undefined) p.catch(()=>{});
        }
    },
    play(id) { 
        if(!this.muted && this[id]) { 
            this[id].currentTime = 0; 
            let p = this[id].play();
            if(p!==undefined) p.catch(()=>{});
        }
    }
};
AudioEngine.init();

// --- Navbar & Scroll Reveal ---
const nav = document.querySelector('.premium-nav');
let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
    if(window.scrollY > lastScrollY && window.scrollY > 150) {
        nav.classList.add('hidden');
    } else {
        nav.classList.remove('hidden');
    }
    lastScrollY = window.scrollY;
}, {passive: true});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target); 
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// --- Timeline Fill Logic ---
const timelineLine = document.querySelector('.timeline-fill-line');
const timelineSection = document.querySelector('.premium-timeline');
window.addEventListener('scroll', () => {
    if (timelineLine && timelineSection) {
        const rect = timelineSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top > windowHeight / 2) {
            timelineLine.style.height = '0%';
        } else {
            const totalScroll = rect.height;
            const scrolled = (windowHeight / 2) - rect.top;
            let percent = (scrolled / totalScroll) * 100;
            percent = Math.max(0, Math.min(100, percent));
            timelineLine.style.height = percent + '%';
        }
    }
}, {passive: true});
// --- Flawless Gameplay Physics (Pointer Events Engine) ---
const State = {
    progress: 0,
    victory: false,
    
    charX: 0, 
    charV: 0,
    friction: 0.94, // Lower friction = more momentum after release
    
    camX: 0,
    camSmooth: 0.08,
    
    dragging: false,
    startX: 0,
    currentX: 0,
    handleOffset: 0
};

const PrevState = {
    charX: 0,
    camX: 0,
    handleOffset: 0,
    progress: 0
};

// Pointer Events (Handles Mouse, Touch, and Pen simultaneously)
UI.handle.addEventListener('pointerdown', e => {
    if (State.victory) return;
    // Capture the pointer so rapid dragging doesn't slip off the button
    UI.handle.setPointerCapture(e.pointerId);
    
    State.dragging = true;
    State.startX = State.currentX = e.clientX;
    AudioEngine.playMusic();
});

UI.handle.addEventListener('pointermove', e => {
    if (!State.dragging || State.victory) return;
    
    State.currentX = e.clientX;
    let stretch = State.currentX - State.startX; 
    
    // Only allow pulling to the left (negative stretch)
    State.handleOffset = stretch < 0 ? stretch : 0;
});

function endDrag(e) {
    if (State.dragging) {
        State.dragging = false;
        // Snap the handle visually back, but chariot momentum continues via friction
        State.handleOffset = 0; 
        UI.handle.releasePointerCapture(e.pointerId);
    }
}

UI.handle.addEventListener('pointerup', endDrag);
UI.handle.addEventListener('pointercancel', endDrag);

// Keyboard Listeners (Accessibility fallback)
UI.handle.addEventListener('keydown', e => {
    if (State.victory) return;
    if (e.key === 'ArrowLeft' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        AudioEngine.playMusic();
        State.charV -= 15; // Give a large impulse
        State.handleOffset = -50; // Visual stretch
        updateProgress(2);
    }
});
UI.handle.addEventListener('keyup', () => {
    State.handleOffset = 0;
});

function updateProgress(amt) {
    State.progress = Math.min(100, State.progress + amt);
}

// --- Particle Engine ---
const particles = [];
class Particle {
    constructor(type) { 
        this.type = type;
        this.reset(true); 
    }
    reset(init) {
        this.x = Math.random() * cw;
        this.y = init ? Math.random() * ch : -20;
        this.vy = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.5);
        this.size = Math.random() * 4 + 2;
        this.color = Math.random() > 0.5 ? '#ff9800' : '#e91e63'; 
        this.rot = Math.random() * 360;
        this.rotS = (Math.random() - 0.5) * 5;
        this.life = 1;
        
        if (this.type === 'firework') {
            this.vy = (Math.random()-0.5)*15;
            this.vx = (Math.random()-0.5)*15;
            this.life = 100;
            this.color = `hsl(${Math.random()*360}, 100%, 60%)`;
        } else if (this.type === 'petal') {
            const colors = ['#FF9800', '#E91E63', '#F44336', '#FFEB3B']; // Marigold, Lotus, Rose, Yellow
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.size = Math.random() * 4 + 2;
        } else if (this.type === 'dust') {
            // Exactly at wheel locations (roughly 80% and 65% of screen width from left)
            this.x = cw * (Math.random() > 0.5 ? 0.8 : 0.65) + (Math.random()-0.5) * 10;
            this.y = ch * 0.85 + (Math.random()-0.5) * 10;
            this.vx = (Math.random()) * 8 + 2; // Blow backwards faster
            this.vy = -(Math.random() * 3 + 1);
            this.size = Math.random() * 6 + 3;
            this.color = `rgba(139, 69, 19, ${Math.random()*0.4})`;
            this.life = 80;
        } else if (this.type === 'smoke') {
            this.x = cw * 0.8 + (Math.random()-0.5) * 50; 
            this.y = ch * 0.7;
            this.vx = (Math.random()-0.5) * 2 + 1;
            this.vy = -(Math.random() * 2 + 1);
            this.size = Math.random() * 15 + 10;
            this.color = `rgba(200, 200, 200, ${Math.random()*0.3})`;
            this.life = 200;
        } else if (this.type === 'pigeon') {
            this.x = -50;
            this.y = Math.random() * (ch * 0.4);
            this.vx = Math.random() * 5 + 3;
            this.vy = (Math.random() - 0.5) * 2;
            this.size = Math.random() * 3 + 2;
            this.color = '#fff';
            this.life = 500;
        } else if (this.type === 'diya') {
            this.x = Math.random() * cw;
            this.y = ch * 0.9 + Math.random() * 20;
            this.vx = Math.random() * 1.5;
            this.vy = Math.sin(Date.now()) * 0.5;
            this.size = Math.random() * 3 + 1;
            this.color = '#FFD700';
            this.life = 300;
        }
    }
    update(camSpeed) {
        if (this.type === 'firework') {
            this.x += this.vx; this.y += this.vy; this.life--;
            if(this.life <= 0) this.reset();
        } else if (this.type === 'dust' || this.type === 'smoke' || this.type === 'pigeon' || this.type === 'diya') {
            this.x += this.vx - camSpeed;
            if (this.type === 'diya') {
                this.y += Math.sin(Date.now() * 0.005 + this.x) * 0.5;
            } else if (this.type === 'pigeon') {
                this.y += Math.cos(Date.now() * 0.003 + this.x) * 1.5;
            } else {
                this.y += this.vy;
            }
            this.life--;
            if (this.type === 'smoke') this.size += 0.2;
            if (this.life <= 0 || this.x > cw + 100) {
                if (this.type === 'dust') this.life = 0;
                else this.reset(false);
            }
        } else {
            this.x += this.vx - camSpeed * 0.5;
            this.y += this.vy;
            this.rot += this.rotS;
            if (this.y > ch + 20 || this.x < -50 || this.x > cw + 50) this.reset(false);
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        
        if (this.type === 'firework') {
            ctx.globalAlpha = Math.max(0, this.life / 100);
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        } else if (this.type === 'dust') {
            ctx.globalAlpha = Math.max(0, this.life / 100);
        } else if (this.type === 'smoke') {
            ctx.globalAlpha = Math.max(0, this.life / 200);
        } else if (this.type === 'pigeon') {
            // Flapping effect
            if (Math.sin(Date.now()*0.02 + this.x) > 0) ctx.globalAlpha = 0.5;
        }
        
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot * Math.PI/180);
        ctx.beginPath();
        
        if (this.type === 'firework' || this.type === 'dust' || this.type === 'smoke' || this.type === 'diya') {
            if (this.type === 'diya') {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#FF5722';
            }
            ctx.arc(0,0,this.size,0,Math.PI*2);
        } else if (this.type === 'pigeon') {
            // Draw tiny V shape
            ctx.moveTo(0,0);
            ctx.lineTo(-this.size, -this.size);
            ctx.lineTo(this.size, -this.size);
        } else {
            ctx.moveTo(0, -this.size);
            ctx.quadraticCurveTo(this.size, 0, 0, this.size);
            ctx.quadraticCurveTo(-this.size, 0, 0, -this.size);
        }
        ctx.fill();
        ctx.restore();
    }
}
for(let i=0; i<30; i++) particles.push(new Particle('petal'));
for(let i=0; i<3; i++) particles.push(new Particle('pigeon'));

// --- Render Loop (Optimized for 60 FPS) ---
let loopId;
function loop() {
    UI.ctx.clearRect(0, 0, cw, ch);

    if (!State.victory) {
        if (State.dragging && State.handleOffset < 0) {
            let force = State.handleOffset * 0.015; 
            State.charV += force;
            updateProgress(Math.abs(force) * 0.2);
            if (Math.random() < Math.abs(State.charV) * 0.01) {
                AudioEngine.play('bell');
            }
        }
        
        State.charX += State.charV;
        State.charV *= State.friction;
        
        // Prevent floating point jitter
        if (Math.abs(State.charV) < 0.01) State.charV = 0;

        let camSpeed = (State.charX - State.camX) * State.camSmooth;
        State.camX += camSpeed;
        if (Math.abs(camSpeed) < 0.01) camSpeed = 0;

        // ONLY WRITE TO DOM IF VALUES ACTUALLY CHANGED (prevents layout thrashing)
        let dx = Math.abs(State.charX - PrevState.charX);
        let dc = Math.abs(State.camX - PrevState.camX);
        let dh = Math.abs(State.handleOffset - PrevState.handleOffset);
        let dp = Math.abs(State.progress - PrevState.progress);
        
        if (dx > 0.1 || dc > 0.1 || dh > 0.1 || dp > 0.1) {
            
            let screenCharX = State.charX - State.camX; 
            let bounce = Math.abs(State.charV) > 0.5 ? Math.sin(Date.now() * 0.02) * 2 : 0;
            
            UI.chariot.style.transform = `translate3d(${screenCharX}px, ${bounce}px, 0)`;

            let wheelRot = (State.charX / (90 * Math.PI)) * 360;
            UI.wheels.forEach(w => w.style.transform = `rotate(${wheelRot}deg)`);

            UI.layers.temple.style.transform = `translate3d(${-State.camX * 0.3}px, 0, 0)`;
            UI.layers.crowd.style.transform = `translate3d(${-State.camX * 0.5}px, 0, 0)`;
            UI.layers.clouds.style.transform = `translate3d(${-State.camX * 0.1}px, 0, 0)`;

            let scaleH = State.dragging ? 0.92 : 1;
            UI.handle.style.transform = `translate3d(${State.handleOffset}px, -50%, 0) scale(${scaleH})`;
            
            let curveX = 500 + State.handleOffset * 1.5;
            UI.ropeLine.setAttribute('d', `M 0 50 Q ${curveX} 70 1000 50`);
            
            // Sync progress DOM
            if (State.progress !== PrevState.progress) {
                UI.progBar.style.width = `${State.progress}%`;
                UI.progText.innerText = `${Math.floor(State.progress)}%`;
                document.querySelector('.progress-hud').setAttribute('aria-valuenow', Math.floor(State.progress));
            }
            if (State.progress >= 100 && !State.victory) {
                UI.progText.innerText = `100%`;
                triggerVictory();
            }

            // Sync prev state
            PrevState.charX = State.charX;
            PrevState.camX = State.camX;
            PrevState.handleOffset = State.handleOffset;
            PrevState.progress = State.progress;
        }
        
        particles.forEach(p => { p.update(camSpeed); p.draw(UI.ctx); });
        
    } else {
        particles.forEach(p => { p.update(0); p.draw(UI.ctx); });
    }

    loopId = requestAnimationFrame(loop);
}
loopId = requestAnimationFrame(loop);

// --- Victory Sequence ---
function triggerVictory() {
    State.victory = true;
    AudioEngine.play('cheer');
    AudioEngine.play('conch');
    
    UI.celebSection.classList.add('active');
    UI.celebSection.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; 
    document.getElementById('btn-restart').focus();
    
    for(let i=0; i<150; i++) particles.push(new Particle('firework'));
}

document.getElementById('btn-restart').addEventListener('click', () => {
    State.progress = 0; State.victory = false;
    State.charX = 0; State.charV = 0; State.camX = 0;
    
    for(let i = particles.length - 1; i >= 0; i--) {
        if(particles[i].type === 'firework') particles.splice(i, 1);
    }
    
    UI.progBar.style.width = '0%';
    UI.progText.innerText = '0%';
    UI.celebSection.classList.remove('active');
    UI.celebSection.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto'; 
    UI.handle.focus();
});

// Theme toggler
document.getElementById('btn-theme').addEventListener('click', () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
});

// --- Gallery & Lightbox Logic ---
const galleryItems = document.querySelectorAll('.gallery-item');
const filterBtns = document.querySelectorAll('.filter-btn');

// Filtering
if(filterBtns.length > 0) {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            
            galleryItems.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filter === 'all' || filter === category) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateZ(0) scale(1)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateZ(0) scale(0.9)';
                    setTimeout(() => {
                        if (btn.classList.contains('active')) item.style.display = 'none';
                    }, 400);
                }
            });
        });
    });
}

// Lightbox
const lightbox = document.getElementById('gallery-lightbox');
if(lightbox) {
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxLoc = document.getElementById('lightbox-location');
    let currentImageIndex = 0;
    let visibleGalleryItems = [];

    function updateVisibleItems() {
        visibleGalleryItems = Array.from(galleryItems).filter(item => item.style.display !== 'none');
    }

    window.openLightbox = (globalIndex) => {
        updateVisibleItems();
        const originalItem = galleryItems[globalIndex];
        currentImageIndex = visibleGalleryItems.indexOf(originalItem);
        if(currentImageIndex === -1) currentImageIndex = 0;
        
        showLightboxImage();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    window.changeLightbox = (direction) => {
        currentImageIndex += direction;
        if (currentImageIndex < 0) currentImageIndex = visibleGalleryItems.length - 1;
        if (currentImageIndex >= visibleGalleryItems.length) currentImageIndex = 0;
        
        if (lightboxSvgContainer) {
            lightboxSvgContainer.style.opacity = '0';
            lightboxSvgContainer.style.transform = 'scale(0.95)';
        }
        
        setTimeout(() => {
            showLightboxImage();
            if (lightboxSvgContainer) {
                lightboxSvgContainer.style.opacity = '1';
                lightboxSvgContainer.style.transform = 'scale(1)';
            }
        }, 200);
    };

    const lightboxSvgContainer = document.getElementById('lightbox-svg-container');

    function showLightboxImage() {
        const item = visibleGalleryItems[currentImageIndex];
        if(!item) return;
        
        // Find either an SVG or an IMG
        const visualElement = item.querySelector('svg') || item.querySelector('img');
        const title = item.querySelector('h4');
        const loc = item.querySelector('.svg-card-overlay p');
        
        if (lightboxSvgContainer && visualElement) {
            lightboxSvgContainer.innerHTML = '';
            const clonedVisual = visualElement.cloneNode(true);
            // If it's an image, ensure it looks good in the lightbox
            if (clonedVisual.tagName.toLowerCase() === 'img') {
                clonedVisual.style.maxWidth = '100%';
                clonedVisual.style.maxHeight = '100%';
                clonedVisual.style.borderRadius = '8px';
                clonedVisual.style.objectFit = 'contain';
            }
            lightboxSvgContainer.appendChild(clonedVisual);
        }
        
        lightboxCaption.textContent = title ? title.textContent : '';
        lightboxLoc.textContent = loc ? loc.textContent : '';
    }

    // Touch Swiping for Lightbox
    let touchStartX = 0;
    let touchEndX = 0;
    lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
    lightbox.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});
    function handleSwipe() {
        if (touchEndX < touchStartX - 50) changeLightbox(1);
        if (touchEndX > touchStartX + 50) changeLightbox(-1);
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
        if(!lightbox.classList.contains('active')) return;
        if(e.key === 'Escape') closeLightbox();
        if(e.key === 'ArrowRight') changeLightbox(1);
        if(e.key === 'ArrowLeft') changeLightbox(-1);
    });
}

// =============================================
// I18N — Bilingual Engine (EN / বাংলা)
// =============================================
const I18N = {
    current: localStorage.getItem('ry-lang') || 'EN',

    strings: {
        EN: {
            'nav.journey':      'The Journey',
            'nav.significance': 'Significance',
            'nav.trinity':      'The Trinity',
            'nav.timeline':     'Timeline',
            'nav.gallery':      'Art & Culture',

            'hero.title': 'Journey to Gundicha',
            'hero.pull':  'Pull the rope left to move the Rath',
            'hero.btn':   'PULL',

            'about.title': 'The Cosmic Journey',
            'about.q1':    'What is Rath Yatra?',
            'about.a1':    'An ancient spectacle where the Lord of the Universe emerges from His sacred sanctum. It is a rare global phenomenon where deities leave their temple to mingle with devotees regardless of caste, creed, or background.',
            'about.q2':    'Why Lord Jagannath Travels',
            'about.a2':    'Driven by divine love, Lord Jagannath travels with His siblings, Lord Balabhadra and Devi Subhadra, to the Gundicha Temple—representing their birth aunt\'s home—for a majestic nine-day vacation.',
            'about.q3':    'Spiritual Resonance',
            'about.a3':    'Symbolizing the journey of the soul towards supreme consciousness, the Rath Yatra bridges humanity and the divine. Recognized globally, it stands as a monumental testament to India\'s living, breathing heritage.',
            'about.stat1': 'Majestic Chariots',
            'about.stat2': 'Sacred Days',
            'about.stat3': 'Global Devotees',

            'trinity.title':      'The Divine Trinity',
            'trinity.bala':       'Lord Balabhadra',
            'trinity.balaDesc':   'The elder brother, embodiment of immense spiritual strength and profound wisdom.',
            'trinity.symbol':     'Symbolism:',
            'trinity.role':       'Role in Rath Yatra:',
            'trinity.balaSymbol': 'Cosmic power & agriculture.',
            'trinity.balaRole':   'Leads the grand procession on his magnificent green and red chariot, Taladhwaja.',
            'trinity.jaga':       'Lord Jagannath',
            'trinity.jagaDesc':   'The Supreme Lord of the Universe, bearing large, compassionate, and unblinking eyes.',
            'trinity.jagaSymbol': 'Infinite love & supreme consciousness.',
            'trinity.jagaRole':   'The cosmic focal point, riding the colossal yellow and red chariot, Nandighosa.',
            'trinity.sub':        'Devi Subhadra',
            'trinity.subDesc':    'The beloved sister, a source of boundless auspiciousness, harmony, and cosmic energy.',
            'trinity.subSymbol':  'Pure devotion & compassion.',
            'trinity.subRole':    'Bridges the brothers on her graceful black and red chariot, Darpadalana.',

            'tl.title':    'The Divine Pilgrimage',
            'tl.subtitle': 'A cosmic journey from the sacred bath to the eternal return.',
            'tl.snanaDate': 'Jyeshtha Purnima', 'tl.snana': 'Snana Yatra',
            'tl.snanaDesc': 'The grand bathing festival. The Lords are brought out and bathed with 108 pitchers of sacred, herbal water, leading to their symbolic fever.',
            'tl.anaDate': '15 Days Retreat', 'tl.ana': 'Anavasara',
            'tl.anaDesc': 'A period of absolute secrecy and healing. The ailing deities rest in the secret chamber (Anasara Ghara), receiving traditional herbal treatments.',
            'tl.navaDate': 'Pre-Yatra', 'tl.nava': 'Nava Jaubana Darshan',
            'tl.navaDesc': 'The rejuvenated Lords reveal their fresh, youthful, and vibrant appearance to the masses, sparking immense devotion and joy.',
            'tl.rathDate': 'Ashadha Shukla Dwitiya', 'tl.rath': 'Rath Yatra',
            'tl.rathDesc': 'The grand procession begins. The Trinity mounts their colossal chariots, pulled by millions of devotees towards the Gundicha Temple.',
            'tl.gunDate': '7 Days Stay', 'tl.gun': 'Gundicha Temple Arrival',
            'tl.gunDesc': 'The Lords arrive at their aunt\'s abode, where they are treated with unparalleled affection, special delicacies, and deep devotion.',
            'tl.heraDate': '5th Day', 'tl.hera': 'Hera Panchami',
            'tl.heraDesc': 'Goddess Lakshmi, furious at being left behind, visits Gundicha Temple to secretly damage Lord Jagannath\'s chariot in an act of divine anger.',
            'tl.bahuDate': 'Return Journey', 'tl.bahu': 'Bahuda Yatra',
            'tl.bahuDesc': 'The grand return. Bidding farewell to their aunt, the Lords trace their path back to the majestic Sri Mandira.',
            'tl.sunaDate': 'Golden Attire', 'tl.suna': 'Suna Besha',
            'tl.sunaDesc': 'Upon their chariots outside the main temple, the Lords are adorned in spectacular, heavy golden armor and ornaments, a sight of blinding glory.',
            'tl.nilDate': 'The Final Ascent', 'tl.nil': 'Niladri Bije',
            'tl.nilDesc': 'The eternal return to the sanctum. Lord Jagannath appeases Goddess Lakshmi with Rasagolas before finally re-entering the Ratna Singhasana.',

            'gallery.title': 'Divine Exhibition',

            'celeb.title':      'Jai Jagannath',
            'celeb.subtitle':   'The Divine Journey is Complete.',
            'celeb.blessing':   'Divine Blessing',
            'celeb.blessingMsg':'\"May Lord Jagannath bless you with peace, prosperity and happiness.\"',
            'celeb.pullAgain':  'Pull Again',
            'celeb.share':      'Share Celebration',
            'celeb.download':   'Download Screenshot',

            'quote.text':   '\"He who beholds the Lord upon the Chariot is forever freed from the endless cycle of birth and rebirth.\"',
            'quote.author': '— Ancient Scriptures',

            'footer.desc': 'An interactive digital tribute to the Lord of the Universe, meticulously crafted for devotion and awe.',
            'footer.copy': '© 2026 Crafted with ❤️ by Snehashis Roy. All Rights Reserved.'
        },

        BN: {
            'nav.journey':      'যাত্রা',
            'nav.significance': 'তাৎপর্য',
            'nav.trinity':      'ত্রিদেব',
            'nav.timeline':     'সময়রেখা',
            'nav.gallery':      'শিল্প ও সংস্কৃতি',

            'hero.title': 'গুণ্ডিচায় যাত্রা',
            'hero.pull':  'রথ টানতে দড়ি বাম দিকে টানুন',
            'hero.btn':   'টানুন',

            'about.title': 'মহাজাগতিক যাত্রা',
            'about.q1':    'রথযাত্রা কী?',
            'about.a1':    'এক প্রাচীন মহোৎসব যেখানে বিশ্বের প্রভু তাঁর পবিত্র গর্ভগৃহ থেকে বেরিয়ে আসেন। এটি একটি বিরল বৈশ্বিক ঘটনা যেখানে দেবতারা জাতি, ধর্ম বা পটভূমি নির্বিশেষে ভক্তদের সাথে মেলামেশা করতে মন্দির ছেড়ে আসেন।',
            'about.q2':    'কেন জগন্নাথ ভ্রমণ করেন',
            'about.a2':    'দিব্য প্রেমের টানে, প্রভু জগন্নাথ তাঁর ভাই-বোন বলভদ্র ও সুভদ্রাকে নিয়ে গুণ্ডিচা মন্দিরে যান — যা তাঁদের মাসির বাড়ি হিসেবে পরিচিত — নয় দিনের এক মহান ভ্রমণে।',
            'about.q3':    'আধ্যাত্মিক অনুরণন',
            'about.a3':    'আত্মার পরম চেতনার দিকে যাত্রার প্রতীক হিসেবে, রথযাত্রা মানবতা ও দিব্যতার মধ্যে সেতুবন্ধন রচনা করে। বিশ্বব্যাপী স্বীকৃত, এটি ভারতের জীবন্ত ঐতিহ্যের এক মহান সাক্ষী।',
            'about.stat1': 'মহাজাগতিক রথ',
            'about.stat2': 'পবিত্র দিন',
            'about.stat3': 'বিশ্বব্যাপী ভক্ত',

            'trinity.title':      'দিব্য ত্রিত্ব',
            'trinity.bala':       'প্রভু বলভদ্র',
            'trinity.balaDesc':   'জ্যেষ্ঠ ভ্রাতা, অপরিসীম আধ্যাত্মিক শক্তি ও গভীর জ্ঞানের মূর্ত রূপ।',
            'trinity.symbol':     'প্রতীক:',
            'trinity.role':       'রথযাত্রায় ভূমিকা:',
            'trinity.balaSymbol': 'মহাজাগতিক শক্তি ও কৃষি।',
            'trinity.balaRole':   'তাঁর সুন্দর সবুজ-লাল রথ তালধ্বজে মহাযাত্রার নেতৃত্ব দেন।',
            'trinity.jaga':       'প্রভু জগন্নাথ',
            'trinity.jagaDesc':   'বিশ্বব্রহ্মাণ্ডের সর্বোচ্চ প্রভু, বড়, করুণাময় ও অপলক চোখের অধিকারী।',
            'trinity.jagaSymbol': 'অনন্ত প্রেম ও পরম চেতনা।',
            'trinity.jagaRole':   'বিশাল হলুদ-লাল রথ নন্দীঘোষে মহাকেন্দ্রীয় উপস্থিতি।',
            'trinity.sub':        'দেবী সুভদ্রা',
            'trinity.subDesc':    'প্রিয় ভগিনী, অফুরন্ত শুভ, সম্প্রীতি ও মহাজাগতিক শক্তির উৎস।',
            'trinity.subSymbol':  'বিশুদ্ধ ভক্তি ও করুণা।',
            'trinity.subRole':    'তাঁর মনোরম কালো-লাল রথ দর্পদলনে দুই ভাইয়ের মধ্যে সেতুবন্ধন।',

            'tl.title':    'দিব্য তীর্থযাত্রা',
            'tl.subtitle': 'পবিত্র স্নান থেকে চিরন্তন প্রত্যাবর্তন পর্যন্ত মহাজাগতিক যাত্রা।',
            'tl.snanaDate': 'জ্যেষ্ঠ পূর্ণিমা', 'tl.snana': 'স্নান যাত্রা',
            'tl.snanaDesc': 'মহান স্নান উৎসব। প্রভুদের বাইরে নিয়ে আসা হয় এবং ১০৮ কলস পবিত্র ভেষজ জলে স্নান করানো হয়, যা তাঁদের প্রতীকী জ্বরের সূচনা করে।',
            'tl.anaDate': '১৫ দিনের বিশ্রাম', 'tl.ana': 'অনাবসর',
            'tl.anaDesc': 'সম্পূর্ণ গোপনীয়তা ও নিরাময়ের সময়কাল। অসুস্থ দেবতারা গোপন কক্ষে বিশ্রাম নেন এবং ঐতিহ্যবাহী ভেষজ চিকিৎসা গ্রহণ করেন।',
            'tl.navaDate': 'যাত্রার আগে', 'tl.nava': 'নব যৌবন দর্শন',
            'tl.navaDesc': 'পুনরুজ্জীবিত প্রভুরা জনগণের কাছে তাঁদের সজীব, তরুণ রূপ প্রকাশ করেন, যা অপরিসীম ভক্তি ও আনন্দের সৃষ্টি করে।',
            'tl.rathDate': 'আষাঢ় শুক্ল দ্বিতীয়া', 'tl.rath': 'রথযাত্রা',
            'tl.rathDesc': 'মহাযাত্রা শুরু হয়। ত্রিদেব তাঁদের বিশাল রথে আরোহণ করেন, লক্ষ লক্ষ ভক্ত গুণ্ডিচা মন্দির পর্যন্ত টেনে নিয়ে যান।',
            'tl.gunDate': '৭ দিনের অবস্থান', 'tl.gun': 'গুণ্ডিচা মন্দিরে আগমন',
            'tl.gunDesc': 'প্রভুরা তাঁদের মাসির আবাসে পৌঁছান, যেখানে তাঁদের অতুলনীয় স্নেহ, বিশেষ সুস্বাদু খাবার ও গভীর ভক্তিতে সেবা করা হয়।',
            'tl.heraDate': '৫ম দিন', 'tl.hera': 'হেরা পঞ্চমী',
            'tl.heraDesc': 'দেবী লক্ষ্মী, পেছনে পড়ে যাওয়ায় ক্রুদ্ধ হয়ে, দিব্য রোষের মধ্যে গোপনে জগন্নাথের রথ ক্ষতিগ্রস্ত করতে গুণ্ডিচা মন্দিরে যান।',
            'tl.bahuDate': 'প্রত্যাবর্তন যাত্রা', 'tl.bahu': 'বহুদা যাত্রা',
            'tl.bahuDesc': 'মহান প্রত্যাবর্তন। মাসিকে বিদায় জানিয়ে প্রভুরা মহান শ্রী মন্দিরে ফিরে আসেন।',
            'tl.sunaDate': 'সোনার পোশাক', 'tl.suna': 'সুনা বেশ',
            'tl.sunaDesc': 'মূল মন্দিরের বাইরে রথে থাকা অবস্থায়, প্রভুদের চমৎকার ভারী সোনার বর্ম ও অলঙ্কারে সাজানো হয়, যা দিব্য জ্যোতির দৃশ্য।',
            'tl.nilDate': 'চূড়ান্ত আরোহণ', 'tl.nil': 'নীলাদ্রি বিজে',
            'tl.nilDesc': 'পবিত্র গর্ভগৃহে চিরন্তন প্রত্যাবর্তন। প্রভু জগন্নাথ রসগোল্লা দিয়ে দেবী লক্ষ্মীকে তুষ্ট করে রত্ন সিংহাসনে পুনঃপ্রবেশ করেন।',

            'gallery.title': 'দিব্য প্রদর্শনী',

            'celeb.title':      'জয় জগন্নাথ',
            'celeb.subtitle':   'দিব্য যাত্রা সম্পন্ন।',
            'celeb.blessing':   'দিব্য আশীর্বাদ',
            'celeb.blessingMsg':'\"প্রভু জগন্নাথ আপনাকে শান্তি, সমৃদ্ধি ও সুখ দান করুন।\"',
            'celeb.pullAgain':  'আবার টানুন',
            'celeb.share':      'উদযাপন শেয়ার করুন',
            'celeb.download':   'স্ক্রিনশট ডাউনলোড',

            'quote.text':   '\"যে ব্যক্তি রথের উপর প্রভুকে দর্শন করেন, তিনি চিরতরে জন্ম-মৃত্যুর চক্র থেকে মুক্তি পান।\"',
            'quote.author': '— প্রাচীন শাস্ত্র',

            'footer.desc': 'বিশ্বব্রহ্মাণ্ডের প্রভুর প্রতি একটি ইন্টারঅ্যাক্টিভ ডিজিটাল শ্রদ্ধাঞ্জলি, ভক্তি ও বিস্ময়ের জন্য নিবেদিত।',
            'footer.copy': '© ২০২৬ স্নেহাশিষ রায় (Snehashis Roy) দ্বারা স্নেহের সাথে তৈরি। সর্বস্বত্ব সংরক্ষিত।'
        }
    },

    apply(lang) {
        this.current = lang;
        localStorage.setItem('ry-lang', lang);
        const t = this.strings[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key] !== undefined) el.textContent = t[key];
        });
        // Update lang button label
        const btn = document.getElementById('btn-lang');
        if (btn) btn.textContent = lang === 'BN' ? 'EN' : 'বাংলা';
        // Update html lang attribute
        document.documentElement.lang = lang === 'BN' ? 'bn' : 'en';
    },

    toggle() {
        this.apply(this.current === 'EN' ? 'BN' : 'EN');
    },

    init() {
        const btn = document.getElementById('btn-lang');
        if (btn) btn.addEventListener('click', () => this.toggle());
        this.apply(this.current);
    }
};

I18N.init();
