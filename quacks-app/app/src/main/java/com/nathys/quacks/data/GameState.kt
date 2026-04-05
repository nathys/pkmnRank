package com.nathys.quacks.data

/**
 * Top-level game phase, used to drive navigation between screens.
 */
enum class GamePhase {
    SETUP,      // Configuring players before the game starts
    DRAWING,    // Active round: players pull chips from their bags
    SHOP,       // Post-round: players spend coins on new chips
}

/**
 * Immutable snapshot of the full game state.
 *
 * @param players       All players in turn order.
 * @param round         Current round number (1-indexed).
 * @param phase         Which phase the game is currently in.
 * @param activePlayer  Index into [players] for whose turn it is during DRAWING phase.
 */
data class GameState(
    val players: List<Player> = emptyList(),
    val round: Int = 1,
    val phase: GamePhase = GamePhase.SETUP,
    val activePlayer: Int = 0,
) {
    val currentPlayer: Player?
        get() = players.getOrNull(activePlayer)

    /** True when every player has either stopped drawing or exploded this round. */
    val allPlayersDone: Boolean
        get() = players.all { it.hasExploded || it.drawnChips.isNotEmpty() }
}
