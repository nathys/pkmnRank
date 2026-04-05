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
 *
 * All drawing-phase actions are keyed by [playerId] so every player can act
 * simultaneously — there is no "active player" turn order.
 */
class GameViewModel : ViewModel() {

    private val _state = MutableStateFlow(GameState())
    val state: StateFlow<GameState> = _state.asStateFlow()

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /** Applies [transform] to the player at [playerId] and returns updated state. */
    private fun GameState.updatePlayer(playerId: Int, transform: (Player) -> Player): GameState {
        val player = players.getOrNull(playerId) ?: return this
        val newPlayers = players.toMutableList().also { it[playerId] = transform(player) }
        return copy(players = newPlayers)
    }

    /** Advances to SHOP if every player is done; otherwise stays in DRAWING. */
    private fun GameState.advanceIfAllDone(): GameState =
        if (allPlayersDone) copy(phase = GamePhase.SHOP) else this

    // ─── Setup phase ─────────────────────────────────────────────────────────

    /**
     * Initialise a fresh game with the given player names and ingredient books.
     * The shop supply is seeded from the [books] selection so limits are correct
     * for whichever expansion books were chosen.
     */
    fun startGame(
        playerNames: List<String>,
        books: Map<ChipColor, IngredientBook> = DEFAULT_BOOKS,
    ) {
        _state.value = GameState(
            players = playerNames.mapIndexed { i, name -> Player(id = i, name = name) },
            round = 1,
            phase = GamePhase.DRAWING,
            selectedBooks = books,
            shopSupply = buildShopSupply(books),
        )
    }

    // ─── Drawing phase ───────────────────────────────────────────────────────

    /**
     * Record that [playerId] drew [chip] from their bag.
     * Automatically marks an explosion when white pip total reaches the threshold.
     * No-op if the player is already done for the round.
     */
    fun drawChip(playerId: Int, chip: Chip) {
        _state.update { state ->
            val player = state.players.getOrNull(playerId) ?: return@update state
            if (player.isDoneDrawing) return@update state
            val drawn = player.drawnChips + chip
            val exploded = drawn.filter { it.color == ChipColor.WHITE }.sumOf { it.value } >= EXPLOSION_THRESHOLD
            state.updatePlayer(playerId) { it.copy(drawnChips = drawn, hasExploded = exploded) }
        }
    }

    /**
     * [playerId] voluntarily stops drawing.
     * Calculates coins (pot value + 1 bonus for not exploding) and marks them done.
     * Advances to SHOP phase if all players are now done.
     */
    fun stopDrawing(playerId: Int) {
        _state.update { state ->
            val player = state.players.getOrNull(playerId) ?: return@update state
            if (player.isDoneDrawing || player.hasExploded) return@update state
            val coins = player.totalDrawnValue + 1  // +1 bonus for stopping safely
            state
                .updatePlayer(playerId) {
                    it.copy(
                        isStopped = true,
                        coins = coins,
                        potPosition = it.potPosition + it.totalDrawnValue,
                    )
                }
                .advanceIfAllDone()
        }
    }

    /**
     * An exploded player resolves their penalty: advance pot position OR take coins.
     * Marks the player as resolved and advances to SHOP if all players are now done.
     *
     * @param takePotPoints If true, advance pot position. If false, take coins instead.
     */
    fun resolveExplosion(playerId: Int, takePotPoints: Boolean) {
        _state.update { state ->
            val player = state.players.getOrNull(playerId) ?: return@update state
            if (!player.hasExploded || player.hasResolved) return@update state
            state
                .updatePlayer(playerId) {
                    if (takePotPoints) {
                        it.copy(
                            potPosition = it.potPosition + it.totalDrawnValue,
                            coins = 0,
                            hasResolved = true,
                        )
                    } else {
                        it.copy(coins = it.totalDrawnValue, hasResolved = true)
                    }
                }
                .advanceIfAllDone()
        }
    }

    // ─── Shop phase ──────────────────────────────────────────────────────────

    /**
     * Purchase [chip] for [playerId].
     * Deducts [cost] coins, adds the chip to the player's bag, and decrements
     * the shared shop supply.  No-ops if the player cannot afford it or the
     * supply of that chip is exhausted.
     */
    fun buyChip(playerId: Int, chip: Chip, cost: Int) {
        _state.update { state ->
            val player = state.players.getOrNull(playerId) ?: return@update state
            val remaining = state.supplyOf(chip)
            if (player.coins < cost || remaining <= 0) return@update state
            state
                .updatePlayer(playerId) {
                    it.copy(bag = it.bag + chip, coins = it.coins - cost)
                }
                .copy(shopSupply = state.shopSupply + (chip to remaining - 1))
        }
    }

    /** End the shop phase: reset per-round fields for all players and start next round. */
    fun endRound() {
        _state.update { state ->
            state.copy(
                players = state.players.map { player ->
                    player.copy(
                        drawnChips = emptyList(),
                        hasExploded = false,
                        isStopped = false,
                        hasResolved = false,
                        coins = 0,
                    )
                },
                round = state.round + 1,
                phase = GamePhase.DRAWING,
            )
        }
    }
}
