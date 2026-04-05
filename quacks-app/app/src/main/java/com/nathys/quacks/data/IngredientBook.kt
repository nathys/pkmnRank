package com.nathys.quacks.data

/**
 * Source box for an ingredient book.
 * The base game provides one book per colour; expansions provide alternatives.
 */
enum class GameExpansion(val displayName: String) {
    BASE("Base Game"),
    HERB_WITCHES("The Herb Witches"),
    ALCHEMISTS("The Alchemists"),
}

/**
 * One purchasable chip in a shop slot.
 *
 * @param chip       The chip the buyer receives.
 * @param cost       Price in coins.
 * @param maxSupply  Physical chips of this type in the box, shared across all players.
 *                   Once this number of chips have been bought across all players,
 *                   this slot becomes unavailable for the remainder of the game.
 */
data class ShopSlot(
    val chip: Chip,
    val cost: Int,
    val maxSupply: Int,
)

/**
 * An ingredient book governs one chip colour for the entire game: what the
 * chips do and what the shop offers.  Before the game starts, players choose
 * one book per colour (base or an expansion alternative).
 *
 * @param color       The chip colour this book covers.
 * @param expansion   Which box this book comes from.
 * @param name        Ingredient name shown in the UI (e.g. "Pumpkins").
 * @param description Brief flavour / rules summary for the ingredient effect.
 * @param shopSlots   Available purchase options, smallest value first.
 */
data class IngredientBook(
    val color: ChipColor,
    val expansion: GameExpansion,
    val name: String,
    val description: String,
    val shopSlots: List<ShopSlot>,
)

// ─── Base game books ─────────────────────────────────────────────────────────
// Supply counts match the base game component list (verified from rulebook).
// White chips have a smaller shop supply because every starting bag already
// contains four white-1 chips; the other colours start with only one each.

val BOOK_WHITE_BASE = IngredientBook(
    color = ChipColor.WHITE,
    expansion = GameExpansion.BASE,
    name = "Cherry Bombs",
    description = "Explosion chips. Each white chip drawn adds its pip value to the explosion counter. At 7+ the pot explodes.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.WHITE, 1), cost = 10, maxSupply = 7),
        ShopSlot(Chip(ChipColor.WHITE, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.WHITE, 4), cost = 30, maxSupply = 2),
    ),
)

val BOOK_ORANGE_BASE = IngredientBook(
    color = ChipColor.ORANGE,
    expansion = GameExpansion.BASE,
    name = "Pumpkins",
    description = "Place a pumpkin token on the pot at your current position when drawn. Score bonus victory points for each pumpkin at the end of the round.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.ORANGE, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.ORANGE, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.ORANGE, 4), cost = 30, maxSupply = 2),
    ),
)

val BOOK_GREEN_BASE = IngredientBook(
    color = ChipColor.GREEN,
    expansion = GameExpansion.BASE,
    name = "Mandrake Root",
    description = "If drawing a green chip would cause an explosion, you may stop instead — the green chip does not count toward the explosion total.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.GREEN, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.GREEN, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.GREEN, 4), cost = 30, maxSupply = 2),
    ),
)

val BOOK_RED_BASE = IngredientBook(
    color = ChipColor.RED,
    expansion = GameExpansion.BASE,
    name = "Feathers",
    description = "When drawn, immediately draw one additional chip from your bag.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.RED, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.RED, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.RED, 4), cost = 30, maxSupply = 2),
    ),
)

val BOOK_YELLOW_BASE = IngredientBook(
    color = ChipColor.YELLOW,
    expansion = GameExpansion.BASE,
    name = "Herbs",
    description = "When drawn, gain rubies equal to the chip's pip value.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.YELLOW, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.YELLOW, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.YELLOW, 4), cost = 30, maxSupply = 2),
    ),
)

val BOOK_BLUE_BASE = IngredientBook(
    color = ChipColor.BLUE,
    expansion = GameExpansion.BASE,
    name = "Crow Skulls",
    description = "When drawn, look at the top chip in your bag. You may return it to the bottom.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.BLUE, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.BLUE, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.BLUE, 4), cost = 30, maxSupply = 2),
    ),
)

val BOOK_PURPLE_BASE = IngredientBook(
    color = ChipColor.PURPLE,
    expansion = GameExpansion.BASE,
    name = "Ghost's Breath",
    description = "When drawn, advance your scoring marker one space on the scoring track.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.PURPLE, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.PURPLE, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.PURPLE, 4), cost = 30, maxSupply = 2),
    ),
)

val BOOK_BLACK_BASE = IngredientBook(
    color = ChipColor.BLACK,
    expansion = GameExpansion.BASE,
    name = "Nightshade",
    description = "When drawn, take a fortune token. Spend fortune tokens to add chips from the shop directly to your bag.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.BLACK, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.BLACK, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.BLACK, 4), cost = 30, maxSupply = 2),
    ),
)

// ─── The Herb Witches expansion books ────────────────────────────────────────
// Provides 4 alternative books (Orange, Green, Yellow, Blue).
// TODO: Verify exact effect text, costs, and supply counts from the rulebook.

val BOOK_ORANGE_HERB_WITCHES = IngredientBook(
    color = ChipColor.ORANGE,
    expansion = GameExpansion.HERB_WITCHES,
    name = "Indian Piper",
    description = "TODO: verify from The Herb Witches rulebook.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.ORANGE, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.ORANGE, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.ORANGE, 4), cost = 30, maxSupply = 2),
    ),
)

val BOOK_GREEN_HERB_WITCHES = IngredientBook(
    color = ChipColor.GREEN,
    expansion = GameExpansion.HERB_WITCHES,
    name = "Wolfsbane",
    description = "TODO: verify from The Herb Witches rulebook.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.GREEN, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.GREEN, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.GREEN, 4), cost = 30, maxSupply = 2),
    ),
)

val BOOK_YELLOW_HERB_WITCHES = IngredientBook(
    color = ChipColor.YELLOW,
    expansion = GameExpansion.HERB_WITCHES,
    name = "Broom Grass",
    description = "TODO: verify from The Herb Witches rulebook.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.YELLOW, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.YELLOW, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.YELLOW, 4), cost = 30, maxSupply = 2),
    ),
)

val BOOK_BLUE_HERB_WITCHES = IngredientBook(
    color = ChipColor.BLUE,
    expansion = GameExpansion.HERB_WITCHES,
    name = "Thorn Apple",
    description = "TODO: verify from The Herb Witches rulebook.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.BLUE, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.BLUE, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.BLUE, 4), cost = 30, maxSupply = 2),
    ),
)

// ─── The Alchemists expansion books ──────────────────────────────────────────
// Provides alternative books for Red, Purple, and Black.
// TODO: Verify exact effect text, costs, and supply counts from the rulebook.

val BOOK_RED_ALCHEMISTS = IngredientBook(
    color = ChipColor.RED,
    expansion = GameExpansion.ALCHEMISTS,
    name = "Fire Salamander",
    description = "TODO: verify from The Alchemists rulebook.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.RED, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.RED, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.RED, 4), cost = 30, maxSupply = 2),
    ),
)

val BOOK_PURPLE_ALCHEMISTS = IngredientBook(
    color = ChipColor.PURPLE,
    expansion = GameExpansion.ALCHEMISTS,
    name = "Amanita",
    description = "TODO: verify from The Alchemists rulebook.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.PURPLE, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.PURPLE, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.PURPLE, 4), cost = 30, maxSupply = 2),
    ),
)

val BOOK_BLACK_ALCHEMISTS = IngredientBook(
    color = ChipColor.BLACK,
    expansion = GameExpansion.ALCHEMISTS,
    name = "Black Locust",
    description = "TODO: verify from The Alchemists rulebook.",
    shopSlots = listOf(
        ShopSlot(Chip(ChipColor.BLACK, 1), cost = 10, maxSupply = 8),
        ShopSlot(Chip(ChipColor.BLACK, 2), cost = 20, maxSupply = 4),
        ShopSlot(Chip(ChipColor.BLACK, 4), cost = 30, maxSupply = 2),
    ),
)

// ─── Book registry ────────────────────────────────────────────────────────────

/**
 * All available ingredient books grouped by colour.
 * White always uses the base Cherry Bombs book (the explosion mechanic does not
 * have an expansion alternative).  Every other colour has its base book first.
 */
val ALL_INGREDIENT_BOOKS: Map<ChipColor, List<IngredientBook>> = mapOf(
    ChipColor.WHITE  to listOf(BOOK_WHITE_BASE),
    ChipColor.ORANGE to listOf(BOOK_ORANGE_BASE, BOOK_ORANGE_HERB_WITCHES),
    ChipColor.GREEN  to listOf(BOOK_GREEN_BASE,  BOOK_GREEN_HERB_WITCHES),
    ChipColor.RED    to listOf(BOOK_RED_BASE,    BOOK_RED_ALCHEMISTS),
    ChipColor.YELLOW to listOf(BOOK_YELLOW_BASE, BOOK_YELLOW_HERB_WITCHES),
    ChipColor.BLUE   to listOf(BOOK_BLUE_BASE,   BOOK_BLUE_HERB_WITCHES),
    ChipColor.PURPLE to listOf(BOOK_PURPLE_BASE, BOOK_PURPLE_ALCHEMISTS),
    ChipColor.BLACK  to listOf(BOOK_BLACK_BASE,  BOOK_BLACK_ALCHEMISTS),
)

/** Default selection: all base game books. */
val DEFAULT_BOOKS: Map<ChipColor, IngredientBook> =
    ALL_INGREDIENT_BOOKS.mapValues { (_, books) -> books.first() }

/** Build the initial shared shop supply from a set of selected books. */
fun buildShopSupply(books: Map<ChipColor, IngredientBook>): Map<Chip, Int> =
    books.values
        .flatMap { it.shopSlots }
        .associate { it.chip to it.maxSupply }
