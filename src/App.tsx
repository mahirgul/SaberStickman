/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import { GameHUD } from './components/GameHUD';
import { TouchControls } from './components/TouchControls';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { PauseModal } from './components/PauseModal';
import { RotatePrompt } from './components/RotatePrompt';
import { RefreshPageModal } from './components/RefreshPageModal';
import {
  GameState,
  GameStats,
  PlayerState,
  Enemy,
  UserSaveData,
  SaberColor,
  GraphicQuality,
  DifficultyMode,
} from './types/game';
import { loadLocalSave, saveLocal, syncToCloud } from './services/cloudStorage';
import { sound } from './audio/soundEngine';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // React State for UI Overlays
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [saveData, setSaveData] = useState<UserSaveData>(loadLocalSave());
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    comboMultiplier: 1.0,
    comboTimer: 0,
    distance: 0,
    enemiesKilled: 0,
    bossesDefeated: 0,
    saberPickupsCollected: 0,
    saberTotalActiveSeconds: 0,
    ultimatesUsed: 0,
    stage: 1,
  });
  const [player, setPlayer] = useState<PlayerState>({
    x: 100,
    y: 200,
    vx: 0,
    vy: 0,
    width: 26,
    height: 48,
    isGrounded: false,
    canDoubleJump: true,
    facingRight: true,
    health: 100,
    maxHealth: 100,
    energy: 30,
    saberActive: true,
    saberTimer: 15.0,
    currentSlash: null,
    slashProgress: 0,
    slashDuration: 0,
    invulnerableTimer: 0,
    animFrame: 0,
    isRunning: false,
    isSliding: false,
    afterimages: [],
  });
  const [boss, setBoss] = useState<Enemy | null>(null);
  const [fps, setFps] = useState<number>(60);
  const [quality, setQuality] = useState<GraphicQuality>(saveData.quality || 'AUTO');
  const [isLowQualityActive, setIsLowQualityActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(saveData.isMuted || false);

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCloudSync, setShowCloudSync] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);
  const [showRefreshModal, setShowRefreshModal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      return (
        search.includes('page=refresh') ||
        search.includes('action=reload') ||
        search.includes('yenile')
      );
    }
    return false;
  });

  // Initialize Canvas & Game Engine once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect touch capability
    const hasTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 840;
    setShowTouchControls(hasTouch);

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    engine.setSaberColor(saveData.selectedSaberColor);
    engine.setGraphicQuality(quality);
    engine.setDifficulty(saveData.difficulty || 'NORMAL');

    const handleResize = () => {
      engine.resize(window.innerWidth, window.innerHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Engine Event Hooks
    engine.onStatsChange = (newStats, newPlayer, newBoss) => {
      setStats({ ...newStats });
      setPlayer({ ...newPlayer });
      setBoss(newBoss ? { ...newBoss } : null);
      setFps(engine.currentFps);
    };

    engine.onStateChange = (newState) => {
      setGameState(newState);
      if (newState === 'GAME_OVER') {
        // Record high score and save
        const updated: UserSaveData = {
          ...saveData,
          highScore: Math.max(saveData.highScore, engine.stats.score),
          maxCombo: Math.max(saveData.maxCombo, engine.stats.maxCombo),
          totalKills: saveData.totalKills + engine.stats.enemiesKilled,
          bossKills: saveData.bossKills + engine.stats.bossesDefeated,
          gamesPlayed: saveData.gamesPlayed + 1,
        };
        setSaveData(updated);
        saveLocal(updated);
        syncToCloud(updated);
      }
    };

    engine.onQualityAdjusted = (isLow) => {
      setIsLowQualityActive(isLow);
    };

    // Global Key Listener for Title start & Pause
    const handleKeyDown = (e: KeyboardEvent) => {
      sound.initCtx();
      if (engine.state === 'TITLE' && (e.code === 'Enter' || e.code === 'Space' || e.key === 'ArrowUp')) {
        engine.startGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      engine.stop();
    };
  }, []);

  // Update sound settings
  useEffect(() => {
    sound.setMuted(isMuted);
  }, [isMuted]);

  // Actions
  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  };

  const handleResume = () => {
    if (engineRef.current && gameState === 'PAUSED') {
      engineRef.current.pauseGame();
    }
  };

  const handleHome = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current.state = 'TITLE';
      setGameState('TITLE');
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    const updated = { ...saveData, isMuted: nextMuted };
    setSaveData(updated);
    saveLocal(updated);
  };

  const handleToggleQuality = () => {
    const nextQuality: GraphicQuality =
      quality === 'AUTO' ? 'HIGH' : quality === 'HIGH' ? 'LOW' : 'AUTO';
    setQuality(nextQuality);
    if (engineRef.current) {
      engineRef.current.setGraphicQuality(nextQuality);
    }
    const updated = { ...saveData, quality: nextQuality };
    setSaveData(updated);
    saveLocal(updated);
  };

  const handleSelectQuality = (q: GraphicQuality) => {
    setQuality(q);
    if (engineRef.current) {
      engineRef.current.setGraphicQuality(q);
    }
    const updated = { ...saveData, quality: q };
    setSaveData(updated);
    saveLocal(updated);
  };

  const handleSelectSaberColor = (color: SaberColor) => {
    const updated = { ...saveData, selectedSaberColor: color };
    setSaveData(updated);
    saveLocal(updated);
    if (engineRef.current) {
      engineRef.current.setSaberColor(color);
    }
  };

  const handleSelectDifficulty = (diff: DifficultyMode) => {
    const updated = { ...saveData, difficulty: diff };
    setSaveData(updated);
    saveLocal(updated);
    if (engineRef.current) {
      engineRef.current.setDifficulty(diff);
    }
  };

  const handleUpdateSave = (newData: UserSaveData) => {
    setSaveData(newData);
    if (engineRef.current) {
      engineRef.current.setSaberColor(newData.selectedSaberColor);
      engineRef.current.setGraphicQuality(newData.quality);
      engineRef.current.setDifficulty(newData.difficulty || 'NORMAL');
    }
  };

  const handleTriggerUltimate = () => {
    if (engineRef.current) {
      engineRef.current.triggerSpecialCombo('ULTIMATE_ZXC');
    }
  };

  const handleSoftReset = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current.startGame();
      setGameState('PLAYING');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* 1. Isolated Game Viewport Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair touch-none"
      />

      {/* 2. Title Screen Shell */}
      {gameState === 'TITLE' && (
        <TitleScreen
          saveData={saveData}
          onStart={handleStartGame}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenCloudSync={() => setShowCloudSync(true)}
          onOpenRefreshPage={() => setShowRefreshModal(true)}
          onSelectSaberColor={handleSelectSaberColor}
          onSelectDifficulty={handleSelectDifficulty}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 3. In-Game Low Occlusion HUD */}
      {gameState === 'PLAYING' && (
        <GameHUD
          stats={stats}
          player={player}
          boss={boss}
          fps={fps}
          quality={quality}
          isLowQualityActive={isLowQualityActive}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onToggleQuality={handleToggleQuality}
          onTriggerUltimate={player.energy >= 75 ? handleTriggerUltimate : undefined}
        />
      )}

      {/* 4. Touch Controls (Mobile Landscape: 2 Left Buttons + 2 Right Buttons) */}
      {gameState === 'PLAYING' && showTouchControls && (
        <TouchControls
          onMoveLeftStart={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
          }}
          onMoveLeftEnd={() => {
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));
          }}
          onMoveRightStart={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
          }}
          onMoveRightEnd={() => {
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
          }}
          onJumpStart={() => engineRef.current?.triggerTouchJump()}
          onJumpEnd={() => engineRef.current?.releaseTouchJump()}
          onAttack={() => engineRef.current?.triggerSmartTouchAttack()}
          isUltimateReady={player.energy >= 75}
        />
      )}

      {/* Mobile Landscape Orientation Prompt */}
      <RotatePrompt />

      {/* 5. Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onHome={handleHome}
          onOpenRefreshPage={() => setShowRefreshModal(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          quality={quality}
          onSelectQuality={handleSelectQuality}
          fps={fps}
        />
      )}

      {/* 6. Game Over Modal with Scoreboard & Leaderboard */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          stats={stats}
          saveData={saveData}
          onRestart={handleRestart}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {/* 7. Global Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal
          currentPlayerName={saveData.playerName}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* 8. Cross-Device Cloud Sync Modal */}
      {showCloudSync && (
        <CloudSyncModal
          saveData={saveData}
          onUpdateSave={handleUpdateSave}
          onClose={() => setShowCloudSync(false)}
        />
      )}

      {/* 9. Dedicated Refresh & Update Center Modal */}
      {showRefreshModal && (
        <RefreshPageModal
          onClose={() => setShowRefreshModal(false)}
          onSoftReset={handleSoftReset}
        />
      )}
    </div>
  );
}
