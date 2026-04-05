package com.nathys.quacks.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import kotlin.math.roundToInt

/**
 * Drawing phase screen. Shows the active player's bag contents, drawn chips,
 * explosion meter, and risk probability. Players tap a chip to "draw" it.
 */
@Composable
fun DrawingScreen(viewModel: GameViewModel, state: com.nathys.quacks.data.GameState) {
    val player = state.currentPlayer ?: return
    var showExplosionDialog by remember(player.id, player.hasExploded) {
        mutableStateOf(player.hasExploded)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // ── Header ───────────────────────────────────────────────────────────
        Text(
            "Round ${state.round}  ·  ${player.name}'s turn",
            style = MaterialTheme.typography.titleLarge,
        )

        // ── Explosion meter ──────────────────────────────────────────────────
        ExplosionMeter(
            whitePips = player.whitePipTotal,
            threshold = EXPLOSION_THRESHOLD,
            risk = player.explosionRisk,
        )

        // ── Drawn chips ──────────────────────────────────────────────────────
        Text("Drawn (${player.drawnChips.size} chips · ${player.totalDrawnValue} pips)",
            style = MaterialTheme.typography.labelLarge)
        if (player.drawnChips.isEmpty()) {
            Text("No chips drawn yet", style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
        } else {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                items(player.drawnChips) { chip -> ChipBadge(chip = chip) }
            }
        }

        Divider()

        // ── Remaining bag ────────────────────────────────────────────────────
        val remaining = player.remainingChips
        Text("Bag (${remaining.size} chips) — tap to draw",
            style = MaterialTheme.typography.labelLarge)

        LazyVerticalGrid(
            columns = GridCells.Adaptive(72.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f),
        ) {
            // Group identical chips to avoid overwhelming the grid; tapping draws one
            val grouped = remaining.groupBy { it }
            items(grouped.entries.toList(), key = { "${it.key.color}-${it.key.value}" }) { (chip, group) ->
                ChipBadge(
                    chip = chip,
                    count = group.size,
                    modifier = Modifier.clickable(enabled = !player.hasExploded) {
                        viewModel.drawChip(chip)
                    },
                )
            }
        }

        // ── Stop button ──────────────────────────────────────────────────────
        Button(
            onClick = { viewModel.stopDrawing() },
            modifier = Modifier.fillMaxWidth(),
            enabled = player.drawnChips.isNotEmpty() && !player.hasExploded,
        ) {
            Text("Stop Drawing")
        }
    }

    // ── Explosion dialog ─────────────────────────────────────────────────────
    if (showExplosionDialog) {
        AlertDialog(
            onDismissRequest = {},
            title = { Text("BOOM! ${player.name}'s pot exploded!") },
            text = {
                Text(
                    "White pip total: ${player.whitePipTotal} / $EXPLOSION_THRESHOLD\n\n" +
                    "Choose one:\n" +
                    "• Advance pot ${player.totalDrawnValue} spaces (no coins)\n" +
                    "• Take ${player.totalDrawnValue} coins (pot stays)",
                )
            },
            confirmButton = {
                Button(onClick = {
                    showExplosionDialog = false
                    viewModel.resolveExplosion(takePotPoints = true)
                }) { Text("Advance pot") }
            },
            dismissButton = {
                OutlinedButton(onClick = {
                    showExplosionDialog = false
                    viewModel.resolveExplosion(takePotPoints = false)
                }) { Text("Take coins") }
            },
        )
    }
}

// ── Reusable composables ─────────────────────────────────────────────────────

/**
 * Visual explosion meter showing current white pip total vs the threshold,
 * plus a colour-coded risk percentage.
 */
@Composable
private fun ExplosionMeter(whitePips: Int, threshold: Int, risk: Float) {
    val fraction = (whitePips.toFloat() / threshold).coerceIn(0f, 1f)
    val barColor = when {
        fraction >= 1f -> Color(0xFFD32F2F)  // exploded
        fraction >= 0.7f -> Color(0xFFFF6F00) // danger
        else -> Color(0xFF388E3C)             // safe
    }

    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text("Cherry bombs: $whitePips / $threshold", style = MaterialTheme.typography.bodyMedium)
            Text(
                "Explosion risk: ${(risk * 100).roundToInt()}%",
                style = MaterialTheme.typography.bodyMedium,
                color = if (risk > 0.5f) Color(0xFFFF6F00) else MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.Bold,
            )
        }
        LinearProgressIndicator(
            progress = { fraction },
            modifier = Modifier.fillMaxWidth().height(12.dp).clip(RoundedCornerShape(6.dp)),
            color = barColor,
            trackColor = MaterialTheme.colorScheme.surface,
        )
    }
}

/**
 * Coloured circular badge representing a chip. Optionally shows a count overlay.
 */
@Composable
fun ChipBadge(chip: Chip, count: Int = 1, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(64.dp)
            .clip(CircleShape)
            .background(chip.color.color)
            .border(1.dp, Color.White.copy(alpha = 0.3f), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "${chip.value}",
                color = chip.color.textColor,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            if (count > 1) {
                Text(
                    text = "×$count",
                    color = chip.color.textColor.copy(alpha = 0.8f),
                    style = MaterialTheme.typography.labelSmall,
                )
            }
        }
    }
}
