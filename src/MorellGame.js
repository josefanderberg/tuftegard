import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

const MorellGame = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [, setLives] = useState(3); // Trigger re-renders on life changes
    const [gameOver, setGameOver] = useState(false);
    const [highscores, setHighscores] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [scoreSubmitted, setScoreSubmitted] = useState(false);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

    const canvasRef = useRef(null);
    const gameAreaRef = useRef(null);
    const basketRef = useRef({ x: 260, y: 350, width: 80, height: 40 });
    const cherriesRef = useRef([]);
    const keysRef = useRef({ left: false, right: false });
    const animationFrameId = useRef(null);
    const scoreRef = useRef(0);
    const livesRef = useRef(3);

    // Fetch highscores on mount
    useEffect(() => {
        fetchHighscores();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchHighscores = async () => {
        setLoadingLeaderboard(true);
        if (!db) {
            loadLocalHighscores();
            return;
        }
        try {
            const q = query(collection(db, "highscores"), orderBy("score", "desc"), limit(10));
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
        setHighscores(local.slice(0, 10));
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
        basketRef.current = { x: 260, y: 350, width: 80, height: 40 };
        keysRef.current = { left: false, right: false };
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
        const rect = canvasRef.current.getBoundingClientRect();
        const root = document.documentElement;
        const mouseX = e.clientX - rect.left - root.scrollLeft;
        // Center the basket on the cursor
        let targetX = mouseX - basketRef.current.width / 2;
        if (targetX < 0) targetX = 0;
        if (targetX > 600 - basketRef.current.width) targetX = 600 - basketRef.current.width;
        basketRef.current.x = targetX;
    };

    const handleTouchMove = (e) => {
        if (!isPlaying || gameOver || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        const touchX = touch.clientX - rect.left;
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

            // Draw game background (Stylized tree outline / sky)
            ctx.fillStyle = '#1e382b'; // Dark green orchard tint background
            ctx.fillRect(0, 0, 600, 400);

            // Draw a hanging branch outline at the top
            ctx.fillStyle = '#12251a';
            ctx.beginPath();
            ctx.ellipse(300, -50, 400, 100, 0, 0, Math.PI * 2);
            ctx.fill();

            // Draw green leaves circles hanging down
            ctx.fillStyle = '#1b3f27';
            ctx.beginPath();
            ctx.arc(100, 40, 50, 0, Math.PI * 2);
            ctx.arc(200, 20, 60, 0, Math.PI * 2);
            ctx.arc(400, 30, 55, 0, Math.PI * 2);
            ctx.arc(500, 50, 50, 0, Math.PI * 2);
            ctx.fill();

            // Draw Basket (basket emoji 🧺 or drawn basket)
            ctx.font = '40px serif';
            ctx.fillText('🧺', basketRef.current.x, basketRef.current.y + 35);

            // Move Basket via keys
            const basketSpeed = 8;
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
                    continue;
                }

                // Check if missed (off bottom)
                if (cherry.y > 410) {
                    livesRef.current -= 1;
                    setLives(livesRef.current);
                    cherriesRef.current.splice(i, 1);

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
        if (highscores.length < 10) return true;
        return score > highscores[highscores.length - 1].score;
    };

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

                    {/* Start / Game Over Screens */}
                    {!isPlaying && (
                        <div className="game-overlay">
                            {gameOver ? (
                                <>
                                    <h4 className="game-title" style={{ color: '#ff4444' }}>Spill Slutt!</h4>
                                    <p style={{ fontSize: '1.4rem', marginBottom: '10px' }}>Du fikk {score} poeng 🍒</p>
                                    
                                    {isTopScore() && !scoreSubmitted ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <p style={{ color: 'var(--gold, #c5a059)', fontWeight: 'bold' }}>Gratulerer! Du kom på Topp 10!</p>
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
            </div>
        </section>
    );
};

export default MorellGame;
