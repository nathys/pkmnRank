package com.nathys.quacks.data

/**
 * Top-level game phase, used to drive navigation between screens.
 */
enum class GamePhase {
    SETUP,      // Configuring players before the game starts
    DRAWING,    // Active round: all players pull chips simultaneously
    SHOP,       // Post-round: players spend coins on new chips
}

/**
 * Immutable snapshot of the full game state.
 * All players draw simultaneously — there is no activePlayer concept.
 *
 * @param players All players in the game.
 * @param round   Current round number (1-indexed).
 * @param phase   Which phase the game is currently in.
 */
data class GameState(
    val players: List<Player> = emptyList(),
    val round: Int = 1,
    val phase: GamePhase = GamePhase.SETUP,
) {
    /** True when every player has finished drawing (stopped or resolved explosion). */
    val allPlayersDone: Boolean
        get() = players.isNotEmpty() && players.all { it.isDoneDrawing }
}
