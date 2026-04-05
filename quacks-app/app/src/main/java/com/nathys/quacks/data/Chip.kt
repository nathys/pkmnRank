package com.nathys.quacks.data

import androidx.compose.ui.graphics.Color

/**
 * All ingredient chip colors in the base game.
 * WHITE chips are cherry bombs — accumulating 7+ points of white causes an explosion.
 */
enum class ChipColor(
    val displayName: String,
    val color: Color,
    val textColor: Color = Color.White,
) {
    WHITE("Cherry Bomb", Color(0xFFF5F5F5), Color.Black),
    ORANGE("Pumpkin", Color(0xFFFF8C00)),
    GREEN("Mandrake", Color(0xFF2E7D32)),
    RED("Feathers", Color(0xFFC62828)),
    YELLOW("Herbs", Color(0xFFF9A825), Color.Black),
    BLUE("Crow Skull", Color(0xFF1565C0)),
    PURPLE("Ghost's Breath", Color(0xFF6A1B9A)),
    BLACK("Nightshade", Color(0xFF212121)),
}

/**
 * A single ingredient chip with a color and pip value (1, 2, or 4).
 * White chips use their value as the explosion counter contribution.
 */
data class Chip(
    val color: ChipColor,
    val value: Int, // 1, 2, or 4
) {
    init {
        require(value in listOf(1, 2, 4)) { "Chip value must be 1, 2, or 4" }
    }
    override fun toString() = "${color.displayName} ($value)"
}

/** The explosion threshold: white chip pip total at or above this blows the pot. */
const val EXPLOSION_THRESHOLD = 7

/** Starting bag composition for each player (standard base game). */
val DEFAULT_STARTING_BAG: List<Chip> = listOf(
    Chip(ChipColor.WHITE, 1),
    Chip(ChipColor.WHITE, 1),
    Chip(ChipColor.WHITE, 1),
    Chip(ChipColor.WHITE, 1),
    Chip(ChipColor.ORANGE, 1),
    Chip(ChipColor.GREEN, 1),
    Chip(ChipColor.BLUE, 1),
    Chip(ChipColor.YELLOW, 1),
)

/**
 * Chips available for purchase in the shop, keyed by cost in coins.
 * Each entry is a (Chip, cost) pair. Players can buy at most one of each
 * ingredient color per shop phase (per standard rules).
 */
val SHOP_OFFERINGS: List<Pair<Chip, Int>> = listOf(
    Pair(Chip(ChipColor.WHITE, 1), 10),
    Pair(Chip(ChipColor.WHITE, 2), 20),
    Pair(Chip(ChipColor.ORANGE, 1), 10),
    Pair(Chip(ChipColor.ORANGE, 2), 20),
    Pair(Chip(ChipColor.GREEN, 1), 10),
    Pair(Chip(ChipColor.GREEN, 2), 20),
    Pair(Chip(ChipColor.RED, 1), 10),
    Pair(Chip(ChipColor.RED, 2), 20),
    Pair(Chip(ChipColor.YELLOW, 1), 10),
    Pair(Chip(ChipColor.YELLOW, 2), 20),
    Pair(Chip(ChipColor.BLUE, 1), 10),
    Pair(Chip(ChipColor.BLUE, 2), 20),
    Pair(Chip(ChipColor.PURPLE, 1), 10),
    Pair(Chip(ChipColor.PURPLE, 2), 20),
    Pair(Chip(ChipColor.BLACK, 1), 10),
    Pair(Chip(ChipColor.BLACK, 2), 20),
)
