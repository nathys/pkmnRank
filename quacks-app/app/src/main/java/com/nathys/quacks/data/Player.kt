package com.nathys.quacks.data

/**
 * Represents a single player's state during a game session.
 *
 * @param id           Unique index (0–3).
 * @param name         Display name.
 * @param bag          All chips currently owned by this player (includes drawn chips).
 * @param drawnChips   Chips pulled from the bag this round, in draw order.
 * @param potPosition  Current position on the scoring spiral (0 = start).
 * @param coins        Coins earned this round (used in shop phase).
 * @param rubies       Rubies accumulated (used to buy extra drops/turns).
 * @param hasExploded  Whether the pot exploded this round (white pips >= threshold).
 */
data class Player(
    val id: Int,
    val name: String,
    val bag: List<Chip> = DEFAULT_STARTING_BAG.toList(),
    val drawnChips: List<Chip> = emptyList(),
    val potPosition: Int = 0,
    val coins: Int = 0,
    val rubies: Int = 0,
    val hasExploded: Boolean = false,
) {
    /** Chips still in the bag (not yet drawn this round). */
    val remainingChips: List<Chip>
        get() = bag.toMutableList().also { remaining ->
            drawnChips.forEach { drawn -> remaining.remove(drawn) }
        }

    /** Sum of white chip pip values drawn so far this round. */
    val whitePipTotal: Int
        get() = drawnChips.filter { it.color == ChipColor.WHITE }.sumOf { it.value }

    /**
     * Probability (0.0–1.0) that the next draw will cause or worsen the explosion.
     * Returns the fraction of remaining chips that are white.
     */
    val explosionRisk: Float
        get() {
            val remaining = remainingChips
            if (remaining.isEmpty()) return 0f
            val whiteRemaining = remaining.count { it.color == ChipColor.WHITE }
            return whiteRemaining.toFloat() / remaining.size
        }

    /** How many more white pip points can be drawn before the pot explodes. */
    val pipsUntilExplosion: Int
        get() = maxOf(0, EXPLOSION_THRESHOLD - whitePipTotal)

    /** Total pip value of all drawn chips (pot position advancement). */
    val totalDrawnValue: Int
        get() = drawnChips.sumOf { it.value }
}
