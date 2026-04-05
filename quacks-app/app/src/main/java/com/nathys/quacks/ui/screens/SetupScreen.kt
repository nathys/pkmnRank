package com.nathys.quacks.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.nathys.quacks.data.*
import com.nathys.quacks.viewmodel.GameViewModel

/** Three-step setup: title/expansions → players → ingredient books. */
private enum class SetupStep { TITLE, PLAYERS, BOOKS }

@Composable
fun SetupScreen(viewModel: GameViewModel) {
    var step by remember { mutableStateOf(SetupStep.TITLE) }
    // Which expansion boxes the group owns (BASE is always included, cannot be toggled off)
    val ownedExpansions = remember { mutableStateSetOf(GameExpansion.BASE) }
    var playerCount by remember { mutableIntStateOf(2) }
    val names = remember { mutableStateListOf("Player 1", "Player 2", "Player 3", "Player 4") }
    // Active book selection per colour; starts with all base books
    val selectedBooks = remember {
        mutableStateMapOf<ChipColor, IngredientBook>().also { it.putAll(DEFAULT_BOOKS) }
    }

    // When expansion ownership changes, reset any book selections that are
    // now unavailable to the base-game fallback for that colour.
    LaunchedEffect(ownedExpansions.toSet()) {
        ChipColor.entries.forEach { color ->
            val current = selectedBooks[color] ?: return@forEach
            if (current.expansion !in ownedExpansions) {
                selectedBooks[color] = ALL_INGREDIENT_BOOKS[color]!!.first()
            }
        }
    }

    when (step) {
        SetupStep.TITLE -> TitleStep(
            ownedExpansions = ownedExpansions,
            onNext = { step = SetupStep.PLAYERS },
        )
        SetupStep.PLAYERS -> PlayersStep(
            playerCount = playerCount,
            names = names,
            onCountChange = { playerCount = it },
            onBack = { step = SetupStep.TITLE },
            onNext = { step = SetupStep.BOOKS },
        )
        SetupStep.BOOKS -> BooksStep(
            ownedExpansions = ownedExpansions,
            selectedBooks = selectedBooks,
            onBack = { step = SetupStep.PLAYERS },
            onStart = { viewModel.startGame(names.take(playerCount), selectedBooks.toMap()) },
        )
    }
}

// ── Step 0: Title + expansion selection ───────────────────────────────────────

@Composable
private fun TitleStep(
    ownedExpansions: MutableSet<GameExpansion>,
    onNext: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.weight(1f))

        // Title block
        Text(
            text = "Quacks of\nQuedlinburg",
            style = MaterialTheme.typography.displaySmall,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.primary,
        )
        Text(
            text = "Helper App",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
        )

        Spacer(Modifier.weight(1f))
        HorizontalDivider()

        // Expansion ownership toggles
        Text(
            text = "Which boxes do you own?",
            style = MaterialTheme.typography.titleSmall,
            modifier = Modifier.fillMaxWidth(),
        )

        // BASE is always checked and cannot be unchecked
        ExpansionToggle(
            expansion = GameExpansion.BASE,
            checked = true,
            enabled = false,
            onToggle = {},
        )
        // Expansion boxes the user may toggle
        GameExpansion.entries
            .filter { it != GameExpansion.BASE }
            .forEach { expansion ->
                ExpansionToggle(
                    expansion = expansion,
                    checked = expansion in ownedExpansions,
                    enabled = true,
                    onToggle = { owned ->
                        if (owned) ownedExpansions.add(expansion) else ownedExpansions.remove(expansion)
                    },
                )
            }

        Spacer(Modifier.weight(1f))

        Button(onClick = onNext, modifier = Modifier.fillMaxWidth()) {
            Text("New Game →")
        }
    }
}

@Composable
private fun ExpansionToggle(
    expansion: GameExpansion,
    checked: Boolean,
    enabled: Boolean,
    onToggle: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(MaterialTheme.colorScheme.surface)
            .clickable(enabled = enabled) { onToggle(!checked) }
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = expansion.displayName,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium,
                color = if (enabled) MaterialTheme.colorScheme.onSurface
                        else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
            )
            if (!enabled) {
                Text(
                    text = "Always included",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                )
            }
        }
        Checkbox(
            checked = checked,
            onCheckedChange = if (enabled) onToggle else null,
            enabled = enabled,
        )
    }
}

// ── Step 1: Players ────────────────────────────────────────────────────────────

@Composable
private fun PlayersStep(
    playerCount: Int,
    names: MutableList<String>,
    onCountChange: (Int) -> Unit,
    onBack: () -> Unit,
    onNext: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Back") }
            Text("Players", style = MaterialTheme.typography.titleLarge)
        }

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Players:", style = MaterialTheme.typography.bodyLarge)
            IconButton(onClick = { if (playerCount > 1) onCountChange(playerCount - 1) }, enabled = playerCount > 1) {
                Icon(Icons.Default.Remove, "Decrease")
            }
            Text("$playerCount", style = MaterialTheme.typography.headlineSmall)
            IconButton(onClick = { if (playerCount < 4) onCountChange(playerCount + 1) }, enabled = playerCount < 4) {
                Icon(Icons.Default.Add, "Increase")
            }
        }

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.weight(1f)) {
            itemsIndexed(names.take(playerCount)) { index, name ->
                OutlinedTextField(
                    value = name,
                    onValueChange = { names[index] = it },
                    label = { Text("Player ${index + 1}") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }

        Button(
            onClick = onNext,
            modifier = Modifier.fillMaxWidth(),
            enabled = names.take(playerCount).all { it.isNotBlank() },
        ) {
            Text("Next: Choose Books →")
        }
    }
}

// ── Step 2: Ingredient books ───────────────────────────────────────────────────

@Composable
private fun BooksStep(
    ownedExpansions: Set<GameExpansion>,
    selectedBooks: MutableMap<ChipColor, IngredientBook>,
    onBack: () -> Unit,
    onStart: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Back") }
            Column {
                Text("Ingredient Books", style = MaterialTheme.typography.titleLarge)
                Text("Choose one book per colour", style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
            }
        }

        HorizontalDivider()

        LazyColumn(
            modifier = Modifier.weight(1f).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(vertical = 12.dp),
        ) {
            ALL_INGREDIENT_BOOKS.forEach { (color, books) ->
                // Only show books from owned expansions
                val availableBooks = books.filter { it.expansion in ownedExpansions }
                item(key = color.name) {
                    BookSelector(
                        color = color,
                        books = availableBooks,
                        selected = selectedBooks[color] ?: availableBooks.first(),
                        onSelect = { selectedBooks[color] = it },
                    )
                }
            }
        }

        HorizontalDivider()

        Button(
            onClick = onStart,
            modifier = Modifier.fillMaxWidth().padding(16.dp),
        ) {
            Text("Start Game")
        }
    }
}

/**
 * Selector row for one ingredient colour.
 * If only one book is available, shows it without toggle UI.
 */
@Composable
private fun BookSelector(
    color: ChipColor,
    books: List<IngredientBook>,
    selected: IngredientBook,
    onSelect: (IngredientBook) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ChipBadge(chip = Chip(color, 1), modifier = Modifier.size(32.dp))
            Text(color.displayName, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
        }
        books.forEach { book ->
            BookCard(book = book, isSelected = book == selected, onClick = { onSelect(book) })
        }
    }
}

@Composable
private fun BookCard(book: IngredientBook, isSelected: Boolean, onClick: () -> Unit) {
    val borderColor = if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent
    val bgColor = if (isSelected)
        MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
    else
        MaterialTheme.colorScheme.surface

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .border(2.dp, borderColor, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(book.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                if (book.expansion != GameExpansion.BASE) {
                    Text(
                        text = book.expansion.displayName,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f))
                            .padding(horizontal = 4.dp, vertical = 1.dp),
                    )
                }
            }
            Text(
                text = book.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                maxLines = 2,
            )
            // Supply line: e.g. "Supply: 7×1  4×2  2×4"
            val supplyLabel = book.shopSlots.joinToString("  ") { "${it.maxSupply}×${it.chip.value}" }
            Text(
                text = "Supply: $supplyLabel",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
            )
        }
        if (isSelected) {
            Spacer(Modifier.width(8.dp))
            Text("✓", color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.titleMedium)
        }
    }
}
