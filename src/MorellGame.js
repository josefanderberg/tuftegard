import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

const drawCherryCluster = (ctx, x, y) => {
    // Stem
    ctx.strokeStyle = '#5a7829';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Left cherry stem
    ctx.moveTo(x, y - 20);
    ctx.quadraticCurveTo(x - 10, y - 10, x - 12, y);
    // Right cherry stem
    ctx.moveTo(x, y - 20);
    ctx.quadraticCurveTo(x + 10, y - 10, x + 12, y + 2);
    ctx.stroke();

    // Small green leaf at the top join
    ctx.fillStyle = '#7ba83c';
    ctx.beginPath();
    ctx.ellipse(x - 4, y - 22, 8, 4, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Red cherries
    // Left cherry
    let grad1 = ctx.createRadialGradient(x - 14, y - 2, 2, x - 12, y, 10);
    grad1.addColorStop(0, '#ff6b6b');
    grad1.addColorStop(0.3, '#e60000');
    grad1.addColorStop(1, '#8a0000');
    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.arc(x - 12, y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Right cherry
    let grad2 = ctx.createRadialGradient(x + 10, y, 2, x + 12, y + 2, 10);
    grad2.addColorStop(0, '#ff6b6b');
    grad2.addColorStop(0.3, '#e60000');
    grad2.addColorStop(1, '#8a0000');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(x + 12, y + 2, 10, 0, Math.PI * 2);
    ctx.fill();

    // White shine highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(x - 15, y - 3, 2, 0, Math.PI * 2);
    ctx.arc(x + 9, y - 1, 2, 0, Math.PI * 2);
    ctx.fill();
};

const MorellGame = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [, setLives] = useState(3); // Trigger re-renders on life changes
    const [gameOver, setGameOver] = useState(false);
    const [highscores, setHighscores] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [scoreSubmitted, setScoreSubmitted] = useState(false);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

    const [missPopup, setMissPopup] = useState({ visible: false, face: 'guy', text: '' });
    const [successPopup, setSuccessPopup] = useState({ visible: false, text: '' });
    const [isExpanded, setIsExpanded] = useState(false);

    const canvasRef = useRef(null);
    const gameAreaRef = useRef(null);
    const basketRef = useRef({ x: 270, y: 350, width: 55, height: 40 });
    const cherriesRef = useRef([]);
    const keysRef = useRef({ left: false, right: false });
    const animationFrameId = useRef(null);
    const scoreRef = useRef(0);
    const livesRef = useRef(3);

    const missTimeoutRef = useRef(null);
    const successTimeoutRef = useRef(null);

    const dogRef = useRef({
        active: false,
        x: -100,
        y: 350,
        state: 'idle', // 'idle', 'running-in', 'pulling', 'running-out'
        timer: 0,
        side: 'left'
    });
    const dogCooldownRef = useRef(0);

    const triggerMissPopup = () => {
        const swearWords = [
            "Søren og!",
            "Fanken!",
            "Nei og nei!",
            "Bomma igjen!",
            "Konsentrer deg!",
            "Følg med da!",
            "Oi da!",
            "Det var nære!",
            "Uflaks!",
            "Oisann!"
        ];
        const randomText = swearWords[Math.floor(Math.random() * swearWords.length)];
        const randomFace = Math.random() > 0.5 ? 'guy' : 'girl';
        
        setMissPopup({
            visible: true,
            face: randomFace,
            text: randomText
        });

        if (missTimeoutRef.current) clearTimeout(missTimeoutRef.current);
        missTimeoutRef.current = setTimeout(() => {
            setMissPopup(prev => ({ ...prev, visible: false }));
        }, 1200);
    };

    const triggerSuccessPopup = () => {
        setSuccessPopup({
            visible: true,
            text: "Du klarer deg bra! Fortsett å kjempe! 🍒"
        });

        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = setTimeout(() => {
            setSuccessPopup(prev => ({ ...prev, visible: false }));
        }, 3000);
    };


    // Fetch highscores on mount
    useEffect(() => {
        fetchHighscores();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        return () => {
            if (missTimeoutRef.current) clearTimeout(missTimeoutRef.current);
            if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        };
    }, []);

    const fetchHighscores = async () => {
        setLoadingLeaderboard(true);
        if (!db) {
            loadLocalHighscores();
            return;
        }
        try {
            const q = query(collection(db, "highscores"), orderBy("score", "desc"), limit(5));
            const snapshot = await getDocs(q);
            const list = [];
            snapshot.forEach(doc => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setHighscores(list);
        } catch (e) {
            console.error("Error fetching highscores", e);
            loadLocalHighscores();
        } finally {
            setLoadingLeaderboard(false);
        }
    };

    const loadLocalHighscores = () => {
        const local = JSON.parse(localStorage.getItem("morell_highscores") || "[]");
        setHighscores(local.slice(0, 5));
        setLoadingLeaderboard(false);
    };

    const saveHighscore = async (e) => {
        e.preventDefault();
        if (!playerName.trim()) return;

        const newEntry = {
            name: playerName.trim(),
            score: score,
            date: new Date().toISOString()
        };

        if (db) {
            try {
                await addDoc(collection(db, "highscores"), newEntry);
                setScoreSubmitted(true);
                fetchHighscores();
            } catch (e) {
                console.error("Error saving score to Firebase, using local storage", e);
                saveLocalHighscore(newEntry);
            }
        } else {
            saveLocalHighscore(newEntry);
        }
    };

    const saveLocalHighscore = (newEntry) => {
        const local = JSON.parse(localStorage.getItem("morell_highscores") || "[]");
        local.push(newEntry);
        local.sort((a, b) => b.score - a.score);
        localStorage.setItem("morell_highscores", JSON.stringify(local));
        setScoreSubmitted(true);
        loadLocalHighscores();
    };

    const startGame = () => {
        setIsPlaying(true);
        setScore(0);
        setLives(3);
        setGameOver(false);
        setScoreSubmitted(false);
        scoreRef.current = 0;
        livesRef.current = 3;
        cherriesRef.current = [];
        basketRef.current = { x: 270, y: 350, width: 55, height: 40 };
        keysRef.current = { left: false, right: false };
        dogRef.current = {
            active: false,
            x: -100,
            y: 350,
            state: 'idle',
            timer: 0,
            side: 'left'
        };
        dogCooldownRef.current = 0;
    };

    // Keyboard handlers
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = true;
        };
        const handleKeyUp = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Mouse and Touch handlers for canvas area
    const handleMouseMove = (e) => {
        if (!isPlaying || gameOver || !canvasRef.current) return;
        if (dogRef.current.active && dogRef.current.state === 'pulling') return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const mouseX = (e.clientX - rect.left) * scaleX;
        // Center the basket on the cursor
        let targetX = mouseX - basketRef.current.width / 2;
        if (targetX < 0) targetX = 0;
        if (targetX > 600 - basketRef.current.width) targetX = 600 - basketRef.current.width;
        basketRef.current.x = targetX;
    };

    const handleTouchMove = (e) => {
        if (!isPlaying || gameOver || !canvasRef.current) return;
        if (dogRef.current.active && dogRef.current.state === 'pulling') return;
        const rect = canvasRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        const scaleX = canvasRef.current.width / rect.width;
        const touchX = (touch.clientX - rect.left) * scaleX;
        let targetX = touchX - basketRef.current.width / 2;
        if (targetX < 0) targetX = 0;
        if (targetX > 600 - basketRef.current.width) targetX = 600 - basketRef.current.width;
        basketRef.current.x = targetX;
    };

    // Game loop
    useEffect(() => {
        if (!isPlaying || gameOver) {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let spawnTimer = 0;
        let speedMultiplier = 1;

        const updateAndRender = () => {
            // Clear canvas
            ctx.clearRect(0, 0, 600, 400);

            // Canvas background is transparent so commentary popups render behind it

            // 1. Draw Background Canopy (very dark green for depth)
            ctx.fillStyle = '#0f2418';
            ctx.beginPath();
            ctx.arc(80, 50, 90, 0, Math.PI * 2);
            ctx.arc(220, 40, 110, 0, Math.PI * 2);
            ctx.arc(380, 40, 120, 0, Math.PI * 2);
            ctx.arc(540, 60, 100, 0, Math.PI * 2);
            ctx.fill();

            // 2. Draw Tree Trunk (brown, left side)
            ctx.fillStyle = '#3a2218';
            ctx.beginPath();
            ctx.moveTo(0, 400);
            ctx.quadraticCurveTo(50, 250, 20, 0);
            ctx.lineTo(50, 0);
            ctx.quadraticCurveTo(80, 250, 45, 400);
            ctx.fill();

            // 3. Draw Branches extending out
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#3a2218';
            
            // Major Branch 1 (middle height)
            ctx.beginPath();
            ctx.moveTo(40, 200);
            ctx.quadraticCurveTo(180, 160, 320, 140);
            ctx.stroke();

            // Sub-branches from Major Branch 1
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(180, 163);
            ctx.quadraticCurveTo(220, 210, 260, 230);
            ctx.moveTo(250, 148);
            ctx.quadraticCurveTo(280, 100, 310, 90);
            ctx.stroke();

            // Major Branch 2 (upper height)
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(30, 100);
            ctx.quadraticCurveTo(150, 80, 250, 40);
            ctx.stroke();
            
            // Branch 3 (right side top hanging in)
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(600, 30);
            ctx.quadraticCurveTo(450, 50, 380, 90);
            ctx.stroke();

            // 4. Draw Foreground Leaves (medium and lighter greens to create depth)
            ctx.fillStyle = '#1b3f27'; // Medium forest green
            ctx.beginPath();
            ctx.arc(60, 30, 50, 0, Math.PI * 2);
            ctx.arc(140, 40, 65, 0, Math.PI * 2);
            ctx.arc(280, 50, 75, 0, Math.PI * 2);
            ctx.arc(420, 60, 80, 0, Math.PI * 2);
            ctx.arc(520, 40, 70, 0, Math.PI * 2);
            ctx.arc(260, 230, 35, 0, Math.PI * 2);
            ctx.arc(320, 140, 40, 0, Math.PI * 2);
            ctx.arc(380, 90, 35, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2d6a4f'; // Brighter green highlights
            ctx.beginPath();
            ctx.arc(110, 60, 35, 0, Math.PI * 2);
            ctx.arc(220, 70, 45, 0, Math.PI * 2);
            ctx.arc(330, 80, 40, 0, Math.PI * 2);
            ctx.arc(450, 85, 45, 0, Math.PI * 2);
            ctx.arc(300, 150, 25, 0, Math.PI * 2);
            ctx.fill();

            // 5. Update & Draw Dog (behind the grass/hill, but raised slightly to be highly visible)
            if (dogRef.current.active) {
                const dog = dogRef.current;
                const basket = basketRef.current;

                if (dog.state === 'lurking') {
                    // Lurk at the edge of the screen, peeking head out
                    dog.x = dog.side === 'left' ? -15 : 575;
                    
                    dog.timer -= 1;
                    if (dog.timer <= 0) {
                        dog.state = 'running-in';
                    }
                } else if (dog.state === 'running-in') {
                    // Run slowly towards the basket
                    const targetX = dog.side === 'left' ? basket.x - 35 : basket.x + basket.width + 5;
                    const diffX = targetX - dog.x;
                    const speed = 2.5; // Walk slowly in the bushes
                    
                    if (Math.abs(diffX) < speed) {
                        dog.x = targetX;
                        dog.state = 'pulling';
                        dog.timer = 6; // 0.1s at 60fps
                    } else {
                        dog.x += Math.sign(diffX) * speed;
                    }
                } else if (dog.state === 'pulling') {
                    // Pull the basket!
                    const pullStrength = 12;
                    if (dog.side === 'left') {
                        basket.x = Math.max(0, basket.x - pullStrength);
                        dog.x = basket.x - 35;
                    } else {
                        basket.x = Math.min(600 - basket.width, basket.x + pullStrength);
                        dog.x = basket.x + basket.width + 5;
                    }

                    dog.timer -= 1;
                    if (dog.timer <= 0) {
                        dog.state = 'running-out';
                    }
                } else if (dog.state === 'running-out') {
                    // Run off-screen
                    const targetX = dog.side === 'left' ? -100 : 700;
                    const diffX = targetX - dog.x;
                    const speed = 4; // Run away a bit faster
                    
                    if (Math.abs(diffX) < speed) {
                        dog.x = targetX;
                        dog.active = false;
                        dog.state = 'idle';
                        dogCooldownRef.current = 240; // 4 seconds cooldown before it can spawn again
                    } else {
                        dog.x += Math.sign(diffX) * speed;
                    }
                }

                // Draw Dog Emoji 🐶 (Raised slightly so it is highly visible)
                ctx.save();
                const isFacingRight = (dog.state === 'running-in' || dog.state === 'lurking') 
                    ? (dog.side === 'left') 
                    : (dog.side === 'right');
                ctx.font = '42px serif';
                ctx.translate(dog.x, dog.y + 5); // Raised so it's fully visible above the hill
                if (!isFacingRight) {
                    ctx.scale(-1, 1);
                    ctx.fillText('🐶', -40, 10);
                } else {
                    ctx.fillText('🐶', 0, 10);
                }

                // Draw warning/alert above where the dog is lurking
                if (dog.state === 'lurking') {
                    ctx.restore();
                    ctx.save();
                    ctx.font = 'bold 16px Arial';
                    ctx.fillStyle = '#ff3333';
                    const alertX = dog.side === 'left' ? 25 : 575;
                    const alertY = dog.y - 10; // Raised warning alert as well
                    ctx.beginPath();
                    ctx.arc(alertX, alertY, 10, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('!', alertX, alertY);
                }
                ctx.restore();
            } else {
                // If dog is not active, handle random spawn
                if (scoreRef.current >= 3) {
                    if (dogCooldownRef.current > 0) {
                        dogCooldownRef.current -= 1;
                    } else {
                        // 0.25% chance per frame (~once every 6-7 seconds)
                        if (Math.random() < 0.0025) {
                            const side = Math.random() > 0.5 ? 'left' : 'right';
                            dogRef.current = {
                                active: true,
                                x: side === 'left' ? -60 : 660,
                                y: 350,
                                state: 'lurking',
                                timer: 60, // Lurk for 1.0 second (60 frames)
                                side: side
                            };
                        }
                    }
                }
            }

            // 6. Draw Grassy Hill/Knoll at the very bottom
            let grassGrad = ctx.createLinearGradient(0, 360, 0, 400);
            grassGrad.addColorStop(0, '#2d6a4f'); // orchard dark green grass
            grassGrad.addColorStop(1, '#1b3f27');
            ctx.fillStyle = grassGrad;
            ctx.beginPath();
            ctx.ellipse(300, 405, 330, 45, 0, 0, Math.PI * 2);
            ctx.fill();

            // 7. Draw left and right edge bushes (dog can hide behind them)
            ctx.fillStyle = '#11251a';
            // Left bush
            ctx.beginPath();
            ctx.arc(10, 380, 35, 0, Math.PI * 2);
            ctx.arc(35, 395, 25, 0, Math.PI * 2);
            ctx.fill();
            // Right bush
            ctx.beginPath();
            ctx.arc(590, 380, 35, 0, Math.PI * 2);
            ctx.arc(565, 395, 25, 0, Math.PI * 2);
            ctx.fill();

            // 8. Draw some grass blades/sprouts on the hill
            ctx.fillStyle = '#52b788';
            ctx.font = '10px sans-serif';
            ctx.fillText('🌱', 60, 375);
            ctx.fillText('🌱', 180, 380);
            ctx.fillText('🌱', 300, 370);
            ctx.fillText('🌱', 420, 378);
            ctx.fillText('🌱', 540, 372);

            // 9. Draw hanging cherry clusters
            drawCherryCluster(ctx, 90, 70);
            drawCherryCluster(ctx, 160, 85);
            drawCherryCluster(ctx, 220, 105);
            drawCherryCluster(ctx, 270, 245);
            drawCherryCluster(ctx, 320, 155);
            drawCherryCluster(ctx, 350, 100);
            drawCherryCluster(ctx, 410, 120);
            drawCherryCluster(ctx, 480, 110);
            drawCherryCluster(ctx, 530, 95);

            // Draw Basket (basket emoji 🧺)
            ctx.font = '50px serif';
            ctx.fillText('🧺', basketRef.current.x, basketRef.current.y + 38);

            // Move Basket via keys
            const basketSpeed = 8;
            const canControl = !(dogRef.current.active && dogRef.current.state === 'pulling');
            if (canControl) {
                if (keysRef.current.left) {
                    basketRef.current.x -= basketSpeed;
                    if (basketRef.current.x < 0) basketRef.current.x = 0;
                }
                if (keysRef.current.right) {
                    basketRef.current.x += basketSpeed;
                    if (basketRef.current.x > 600 - basketRef.current.width) {
                        basketRef.current.x = 600 - basketRef.current.width;
                    }
                }
            }

            // Increase speed slightly as score goes up
            speedMultiplier = 1 + scoreRef.current * 0.05;

            // Spawn Cherries
            spawnTimer++;
            const spawnInterval = Math.max(30, 75 - scoreRef.current * 2); // Spawns faster as score increases
            if (spawnTimer >= spawnInterval) {
                cherriesRef.current.push({
                    x: Math.random() * (560) + 20,
                    y: 10,
                    radius: 12,
                    speed: (Math.random() * 2 + 3) * speedMultiplier
                });
                spawnTimer = 0;
            }

            // Update & Draw Cherries
            for (let i = cherriesRef.current.length - 1; i >= 0; i--) {
                const cherry = cherriesRef.current[i];
                cherry.y += cherry.speed;

                // Draw Cherry emoji 🍒
                ctx.font = '24px serif';
                ctx.fillText('🍒', cherry.x - 12, cherry.y + 8);

                // Collision Detection with Basket
                const basket = basketRef.current;
                const hitX = cherry.x >= basket.x && cherry.x <= basket.x + basket.width;
                const hitY = cherry.y + 10 >= basket.y && cherry.y <= basket.y + basket.height;

                if (hitX && hitY) {
                    // Caught it!
                    scoreRef.current += 1;
                    setScore(scoreRef.current);
                    cherriesRef.current.splice(i, 1);
                    if (scoreRef.current === 10) {
                        triggerSuccessPopup();
                    }
                    continue;
                }

                // Check if missed (off bottom)
                if (cherry.y > 410) {
                    livesRef.current -= 1;
                    setLives(livesRef.current);
                    cherriesRef.current.splice(i, 1);

                    triggerMissPopup();

                    if (livesRef.current <= 0) {
                        setGameOver(true);
                        setIsPlaying(false);
                    }
                }
            }

            // HUD
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px "Quicksand", sans-serif';
            ctx.fillText(`Poeng: ${scoreRef.current}`, 20, 30);
            ctx.fillText(`Liv: ${'❤️'.repeat(livesRef.current)}`, 500, 30);

            if (livesRef.current > 0) {
                animationFrameId.current = requestAnimationFrame(updateAndRender);
            }
        };

        animationFrameId.current = requestAnimationFrame(updateAndRender);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isPlaying, gameOver]);

    const isTopScore = () => {
        if (score === 0) return false;
        if (highscores.length < 5) return true;
        return score > highscores[highscores.length - 1].score;
    };

    if (!isExpanded) {
        return (
            <section id="morellspill" style={{ padding: '60px 20px', backgroundColor: '#fff', position: 'relative', zIndex: 1, borderTop: '1px solid #eee' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', fontFamily: 'Quicksand, sans-serif' }}>
                    <span className="label" style={{ color: 'var(--gold, #c5a059)' }}>Spill & Moro</span>
                    <h3 className="section-title" style={{ fontSize: '2rem', marginBottom: '10px' }}>Vil du spille et spill? 🍒</h3>
                    <p style={{ fontSize: '1.05rem', color: '#555', marginBottom: '20px' }}>
                        Prøv vårt morsomme morellspill og kjempe om en plass på topplisten!
                    </p>
                    <button className="btn-primary" onClick={() => setIsExpanded(true)}>Åpne spill</button>
                </div>
            </section>
        );
    }

    return (
        <section id="morellspill" style={{ padding: '80px 20px', backgroundColor: '#fff', position: 'relative', zIndex: 1 }}>
            <style dangerouslySetInnerHTML={{ __html: `
                .game-container {
                    max-width: 600px;
                    margin: 0 auto;
                    text-align: center;
                    font-family: 'Quicksand', sans-serif;
                }
                .game-canvas-wrapper {
                    position: relative;
                    width: 100%;
                    max-width: 600px;
                    height: 400px;
                    margin: 20px auto;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                    background-color: #1e382b;
                }
                .game-canvas {
                    display: block;
                    width: 100%;
                    height: 100%;
                    cursor: none;
                    position: relative;
                    z-index: 2;
                    background: transparent;
                }
                .game-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(18, 37, 26, 0.85);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    color: #fff;
                    padding: 20px;
                    box-sizing: border-box;
                    z-index: 10;
                }
                .game-title {
                    font-family: 'Fredoka', sans-serif;
                    font-size: 2.2rem;
                    color: var(--gold, #c5a059);
                    margin-bottom: 10px;
                }
                .game-instructions {
                    font-size: 0.95rem;
                    margin-bottom: 25px;
                    color: #ccc;
                    max-width: 400px;
                    line-height: 1.5;
                }
                .leaderboard-table {
                    width: 100%;
                    max-width: 400px;
                    margin: 20px auto 0;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                    color: #333;
                }
                .leaderboard-table th {
                    border-bottom: 2px solid var(--gold, #c5a059);
                    padding: 8px;
                    color: #555;
                    font-family: 'Fredoka', sans-serif;
                }
                .leaderboard-table td {
                    padding: 8px;
                    border-bottom: 1px solid #eee;
                }
                .leaderboard-table tr:nth-child(even) {
                    background-color: #fcfcfc;
                }
                .leaderboard-title {
                    font-family: 'Fredoka', sans-serif;
                    font-size: 1.5rem;
                    margin-top: 40px;
                    color: #1a1a1a;
                }
                .highscore-input-form {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                    width: 100%;
                    max-width: 300px;
                }
                .highscore-input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid var(--gold, #c5a059);
                    border-radius: 4px;
                    font-size: 0.95rem;
                    outline: none;
                }
                .highscore-button {
                    background-color: var(--gold, #c5a059);
                    color: #fff;
                    border: none;
                    padding: 10px 15px;
                    font-weight: bold;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                .highscore-button:hover {
                    opacity: 0.9;
                }
                .game-comment-popup {
                    position: absolute;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    z-index: 1;
                    pointer-events: none;
                    opacity: 0.85; /* Faded but slightly higher opacity since it renders behind the canvas */
                }
                .miss-left {
                    bottom: 20px;
                    left: 20px;
                }
                .success-right {
                    bottom: 20px;
                    right: 20px;
                }
                .avatar-circle {
                    width: 90px;
                    height: 90px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 3px solid var(--gold, #c5a059);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    position: relative;
                    background-color: #000;
                    flex-shrink: 0;
                }
                .avatar-img {
                    position: absolute;
                    max-width: none;
                }
                .crop-guy {
                    width: 500px;
                    left: -265px;
                    top: -135px;
                }
                .crop-girl {
                    width: 500px;
                    left: -356px;
                    top: -168px;
                }
                .crop-glenn {
                    width: 250px;
                    left: -45px;
                    top: -230px;
                }
                .speech-bubble {
                    background-color: #ffffff;
                    color: #333333;
                    border-radius: 12px;
                    padding: 10px 15px;
                    font-size: 0.95rem;
                    font-weight: bold;
                    position: relative;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.25);
                    max-width: 180px;
                    line-height: 1.4;
                    text-align: left;
                }
                .left-arrow::before {
                    content: '';
                    position: absolute;
                    left: -8px;
                    top: 50%;
                    transform: translateY(-50%);
                    border-top: 8px solid transparent;
                    border-bottom: 8px solid transparent;
                    border-right: 8px solid #ffffff;
                }
                .right-arrow::before {
                    content: '';
                    position: absolute;
                    right: -8px;
                    top: 50%;
                    transform: translateY(-50%);
                    border-top: 8px solid transparent;
                    border-bottom: 8px solid transparent;
                    border-left: 8px solid #ffffff;
                }
                .animate-pop {
                    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                @keyframes popIn {
                    from {
                        transform: scale(0.6);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}} />

            <div className="game-container">
                <span className="label" style={{ color: 'var(--gold, #c5a059)' }}>Spill & Moro</span>
                <h3 className="section-title">Morellfangst!</h3>
                <p style={{ maxWidth: '500px', margin: '0 auto' }}>
                    Klarer du å fange morellene før de faller i bakken? Flytt korgen med musen, touch eller piltastene.
                </p>

                <div className="game-canvas-wrapper" ref={gameAreaRef}>
                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={400}
                        className="game-canvas"
                        onMouseMove={handleMouseMove}
                        onTouchMove={handleTouchMove}
                    />

                    {/* Miss Popup (Guy/Girl swearing) */}
                    {isPlaying && missPopup.visible && (
                        <div className="game-comment-popup miss-left animate-pop">
                            <div className="avatar-circle">
                                <img 
                                    src="/people.jpg" 
                                    alt="Face" 
                                    className={`avatar-img ${missPopup.face === 'guy' ? 'crop-guy' : 'crop-girl'}`} 
                                />
                            </div>
                            <div className="speech-bubble left-arrow">
                                {missPopup.text}
                            </div>
                        </div>
                    )}

                    {/* Success Popup (Glenn motivating) */}
                    {isPlaying && successPopup.visible && (
                        <div className="game-comment-popup success-right animate-pop">
                            <div className="speech-bubble right-arrow">
                                {successPopup.text}
                            </div>
                            <div className="avatar-circle">
                                <img 
                                    src="/glenn.jpg" 
                                    alt="Glenn" 
                                    className="avatar-img crop-glenn" 
                                />
                            </div>
                        </div>
                    )}

                    {/* Start / Game Over Screens */}
                    {!isPlaying && (
                        <div className="game-overlay">
                            {gameOver ? (
                                <>
                                    <h4 className="game-title" style={{ color: '#ff4444' }}>Spill Slutt!</h4>
                                    <p style={{ fontSize: '1.4rem', marginBottom: '10px' }}>Du fikk {score} poeng 🍒</p>
                                    
                                    {isTopScore() && !scoreSubmitted ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <p style={{ color: 'var(--gold, #c5a059)', fontWeight: 'bold' }}>Gratulerer! Du kom på Topp 5!</p>
                                            <form onSubmit={saveHighscore} className="highscore-input-form">
                                                <input
                                                    type="text"
                                                    placeholder="Skriv navnet ditt..."
                                                    maxLength={15}
                                                    value={playerName}
                                                    onChange={e => setPlayerName(e.target.value)}
                                                    className="highscore-input"
                                                    required
                                                />
                                                <button type="submit" className="highscore-button">Send inn</button>
                                            </form>
                                        </div>
                                    ) : (
                                        scoreSubmitted && <p style={{ color: '#4caf50' }}>Poengsummen din er lagret!</p>
                                    )}

                                    <button className="btn-primary" style={{ marginTop: '20px' }} onClick={startGame}>Spill Igjen</button>
                                </>
                            ) : (
                                <>
                                    <h4 className="game-title">Morellfangst</h4>
                                    <p className="game-instructions">
                                        Flytt korgen 🧺 for å fange de fallende morellene 🍒. <br />
                                        Du mister et liv ❤️ om de treffer bakken. Spillet blir raskere etter hvert!
                                    </p>
                                    <button className="btn-primary" onClick={startGame}>Start Spill</button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Leaderboard */}
                <h4 className="leaderboard-title">Toppliste 🏆</h4>
                {loadingLeaderboard ? (
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Laster highscores...</p>
                ) : (
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', width: '60px' }}>Rank</th>
                                <th style={{ textAlign: 'left' }}>Navn</th>
                                <th style={{ textAlign: 'right', width: '100px' }}>Poeng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {highscores.map((entry, index) => (
                                <tr key={entry.id || index} style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                                    <td>#{index + 1}</td>
                                    <td>{entry.name}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--gold, #c5a059)' }}>{entry.score} 🍒</td>
                                </tr>
                            ))}
                            {highscores.length === 0 && (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>Ingen registrert ennå. Bli den første!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                <button className="btn-outline" style={{ marginTop: '30px', padding: '10px 25px', fontSize: '0.9rem' }} onClick={() => setIsExpanded(false)}>
                    Skjul spill
                </button>
            </div>
        </section>
    );
};

export default MorellGame;
