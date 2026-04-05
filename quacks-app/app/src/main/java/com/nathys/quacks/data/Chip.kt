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
 * A single ingredient chip with a color and pip value.
 * Standard sizes are 1, 2, and 4 (or 3 for some expansion books).
 * White chips use their value as the explosion counter contribution.
 */
data class Chip(
    val color: ChipColor,
    val value: Int,
) {
    init {
        require(value in 1..4) { "Chip value must be between 1 and 4" }
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

// Shop offerings are now defined per ingredient book in IngredientBook.kt.
