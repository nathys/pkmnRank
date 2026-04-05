package com.nathys.quacks.viewmodel

import androidx.lifecycle.ViewModel
import com.nathys.quacks.data.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/**
 * Single source of truth for all game state. Exposes immutable [StateFlow] so
 * Compose screens can observe changes without referencing mutable internals.
 */
class GameViewModel : ViewModel() {

    private val _state = MutableStateFlow(GameState())
    val state: StateFlow<GameState> = _state.asStateFlow()

    // ─── Setup phase ────────────────────────────────────────────────────────

    /** Create [count] players with default names and standard starting bags. */
    fun startGame(playerNames: List<String>) {
        val players = playerNames.mapIndexed { i, name ->
            Player(id = i, name = name)
        }
        _state.value = GameState(
            players = players,
            round = 1,
            phase = GamePhase.DRAWING,
            activePlayer = 0,
        )
    }

    // ─── Drawing phase ───────────────────────────────────────────────────────

    /**
     * Record that the active player drew [chip] from their bag.
     * Automatically marks an explosion if white pip total reaches the threshold.
     */
    fun drawChip(chip: Chip) {
        _state.update { state ->
            val player = state.currentPlayer ?: return@update state
            val drawn = player.drawnChips + chip
            val exploded = drawn.filter { it.color == ChipColor.WHITE }.sumOf { it.value } >= EXPLOSION_THRESHOLD
            val updated = player.copy(drawnChips = drawn, hasExploded = exploded)
            state.copy(players = state.players.toMutableList().also { it[player.id] = updated })
        }
    }

    /**
     * The active player chooses to stop drawing and bank their pot progress.
     * Calculates coins earned based on pot position and advances to the next player.
     */
    fun stopDrawing() {
        _state.update { state ->
            val player = state.currentPlayer ?: return@update state
            // Coins = pot position + bonus for non-exploding players
            val coins = player.totalDrawnValue + if (!player.hasExploded) 1 else 0
            val updated = player.copy(coins = coins, potPosition = player.potPosition + player.totalDrawnValue)
            val newPlayers = state.players.toMutableList().also { it[player.id] = updated }

            val nextActive = (state.activePlayer + 1) % state.players.size
            // If we've cycled back to player 0, all players have had their turn → go to shop
            val nextPhase = if (nextActive == 0) GamePhase.SHOP else GamePhase.DRAWING
            state.copy(players = newPlayers, phase = nextPhase, activePlayer = nextActive)
        }
    }

    /**
     * Called when an exploded player resolves their explosion penalty.
     * Exploded players must choose: advance pot position OR take coins (not both).
     *
     * @param takePotPoints If true, advance pot position. If false, take coins.
     */
    fun resolveExplosion(takePotPoints: Boolean) {
        _state.update { state ->
            val player = state.currentPlayer ?: return@update state
            val updated = if (takePotPoints) {
                player.copy(
                    potPosition = player.potPosition + player.totalDrawnValue,
                    coins = 0,
                )
            } else {
                player.copy(
                    coins = player.totalDrawnValue,
                    // Pot position does not advance on explosion if taking coins
                )
            }
            val newPlayers = state.players.toMutableList().also { it[player.id] = updated }
            val nextActive = (state.activePlayer + 1) % state.players.size
            val nextPhase = if (nextActive == 0) GamePhase.SHOP else GamePhase.DRAWING
            state.copy(players = newPlayers, phase = nextPhase, activePlayer = nextActive)
        }
    }

    // ─── Shop phase ──────────────────────────────────────────────────────────

    /**
     * Purchase [chip] for [player]. Deducts [cost] coins and adds the chip to
     * the player's bag. No-ops if the player cannot afford it.
     */
    fun buyChip(playerId: Int, chip: Chip, cost: Int) {
        _state.update { state ->
            val player = state.players.getOrNull(playerId) ?: return@update state
            if (player.coins < cost) return@update state
            val updated = player.copy(
                bag = player.bag + chip,
                coins = player.coins - cost,
            )
            state.copy(players = state.players.toMutableList().also { it[playerId] = updated })
        }
    }

    /** End the shop phase: reset drawn chips for all players and advance to next round. */
    fun endRound() {
        _state.update { state ->
            val resetPlayers = state.players.map { player ->
                player.copy(drawnChips = emptyList(), hasExploded = false, coins = 0)
            }
            state.copy(
                players = resetPlayers,
                round = state.round + 1,
                phase = GamePhase.DRAWING,
                activePlayer = 0,
            )
        }
    }
}
