package com.nathys.quacks.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
 * Drawing phase — all players are shown simultaneously and can interact
 * independently. Android's touch dispatch routes each finger to its own
 * composable, so simultaneous multi-touch draws "just work" as long as
 * player sections are separate composable trees (which they are here).
 *
 * Layout:
 *   1 player  → full screen
 *   2 players → left | right
 *   3 players → top-left | top-right / bottom (full width)
 *   4 players → top-left | top-right / bottom-left | bottom-right
 */
@Composable
fun DrawingScreen(viewModel: GameViewModel, state: GameState) {
    val players = state.players

    Column(modifier = Modifier.fillMaxSize()) {
        // Round header
        Text(
            text = "Round ${state.round}  ·  Draw phase",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface)
                .padding(horizontal = 16.dp, vertical = 6.dp),
        )

        // Split-screen grid
        when (players.size) {
            1 -> PlayerDrawArea(players[0], viewModel, Modifier.fillMaxSize())
            2 -> Row(Modifier.fillMaxSize()) {
                PlayerDrawArea(players[0], viewModel, Modifier.weight(1f).fillMaxHeight())
                VerticalDivider(thickness = 2.dp, color = MaterialTheme.colorScheme.outline)
                PlayerDrawArea(players[1], viewModel, Modifier.weight(1f).fillMaxHeight())
            }
            3 -> Column(Modifier.fillMaxSize()) {
                Row(Modifier.weight(1f).fillMaxWidth()) {
                    PlayerDrawArea(players[0], viewModel, Modifier.weight(1f).fillMaxHeight())
                    VerticalDivider(thickness = 2.dp, color = MaterialTheme.colorScheme.outline)
                    PlayerDrawArea(players[1], viewModel, Modifier.weight(1f).fillMaxHeight())
                }
                HorizontalDivider(thickness = 2.dp, color = MaterialTheme.colorScheme.outline)
                PlayerDrawArea(players[2], viewModel, Modifier.weight(1f).fillMaxWidth())
            }
            4 -> Column(Modifier.fillMaxSize()) {
                Row(Modifier.weight(1f).fillMaxWidth()) {
                    PlayerDrawArea(players[0], viewModel, Modifier.weight(1f).fillMaxHeight())
                    VerticalDivider(thickness = 2.dp, color = MaterialTheme.colorScheme.outline)
                    PlayerDrawArea(players[1], viewModel, Modifier.weight(1f).fillMaxHeight())
                }
                HorizontalDivider(thickness = 2.dp, color = MaterialTheme.colorScheme.outline)
                Row(Modifier.weight(1f).fillMaxWidth()) {
                    PlayerDrawArea(players[2], viewModel, Modifier.weight(1f).fillMaxHeight())
                    VerticalDivider(thickness = 2.dp, color = MaterialTheme.colorScheme.outline)
                    PlayerDrawArea(players[3], viewModel, Modifier.weight(1f).fillMaxHeight())
                }
            }
        }
    }
}

/**
 * One player's drawing area. Shows a different UI depending on their state:
 *   - Active drawing: bag chip grid + explosion meter + stop button
 *   - Exploded (unresolved): explosion resolution buttons
 *   - Done: round summary
 *
 * Each instance is a separate composable tree, so touch events dispatched here
 * are fully independent from other players' areas (multi-touch safe).
 */
@Composable
private fun PlayerDrawArea(player: Player, viewModel: GameViewModel, modifier: Modifier = Modifier) {
    // Tint the entire area red when exploded, green when safely stopped
    val bgTint = when {
        player.hasExploded && !player.hasResolved -> Color(0xFF3D0000)
        player.isStopped -> Color(0xFF003D00)
        else -> MaterialTheme.colorScheme.background
    }

    Column(
        modifier = modifier
            .background(bgTint)
            .padding(8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        // Player name
        Text(
            text = player.name,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
        )

        when {
            // Exploded — awaiting resolution
            player.hasExploded && !player.hasResolved -> ExplosionResolutionArea(player, viewModel)
            // Done for this round
            player.isDoneDrawing -> RoundSummaryArea(player)
            // Active drawing
            else -> ActiveDrawArea(player, viewModel)
        }
    }
}

// ── Active drawing ─────────────────────────────────────────────────────────────

@Composable
private fun ActiveDrawArea(player: Player, viewModel: GameViewModel) {
    ExplosionMeter(
        whitePips = player.whitePipTotal,
        threshold = EXPLOSION_THRESHOLD,
        risk = player.explosionRisk,
    )

    Text(
        text = "${player.drawnChips.size} drawn · ${player.totalDrawnValue} pips",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
    )

    // Bag chips grouped by type; tapping draws one instance of that chip.
    // userScrollEnabled = false prevents the inner grid from stealing swipe
    // gestures away from sibling player areas in split-screen.
    val grouped = player.remainingChips.groupBy { it }
    if (grouped.isEmpty()) {
        Text(
            "Bag empty",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
        )
    } else {
        LazyVerticalGrid(
            columns = GridCells.Adaptive(52.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier.weight(1f),
            userScrollEnabled = false,
        ) {
            items(grouped.entries.toList(), key = { "${it.key.color}-${it.key.value}" }) { (chip, group) ->
                ChipBadge(
                    chip = chip,
                    count = group.size,
                    modifier = Modifier
                        .size(52.dp)
                        // Each chip's clickable is its own gesture scope — multi-touch safe
                        .clickable { viewModel.drawChip(player.id, chip) },
                )
            }
        }
    }

    Button(
        onClick = { viewModel.stopDrawing(player.id) },
        enabled = player.drawnChips.isNotEmpty(),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text("Stop", style = MaterialTheme.typography.labelMedium)
    }
}

// ── Explosion resolution ───────────────────────────────────────────────────────

@Composable
private fun ExplosionResolutionArea(player: Player, viewModel: GameViewModel) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            "BOOM!",
            style = MaterialTheme.typography.headlineMedium,
            color = Color(0xFFFF5252),
            fontWeight = FontWeight.Bold,
        )
        Text(
            "White: ${player.whitePipTotal} / $EXPLOSION_THRESHOLD",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
        )
        Spacer(Modifier.height(8.dp))
        Text("Choose one:", style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
        Spacer(Modifier.height(8.dp))
        Button(
            onClick = { viewModel.resolveExplosion(player.id, takePotPoints = true) },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("+${player.totalDrawnValue} pot", style = MaterialTheme.typography.labelMedium)
        }
        OutlinedButton(
            onClick = { viewModel.resolveExplosion(player.id, takePotPoints = false) },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("+${player.totalDrawnValue} coins", style = MaterialTheme.typography.labelMedium)
        }
    }
}

// ── Round summary (done) ───────────────────────────────────────────────────────

@Composable
private fun RoundSummaryArea(player: Player) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            if (player.hasExploded) "Exploded" else "Stopped",
            style = MaterialTheme.typography.bodyMedium,
            color = if (player.hasExploded) Color(0xFFFF5252) else Color(0xFF66BB6A),
        )
        Spacer(Modifier.height(4.dp))
        Text("Pot: ${player.potPosition}", style = MaterialTheme.typography.bodySmall)
        Text("Coins: ${player.coins}", style = MaterialTheme.typography.bodySmall)
    }
}

// ── Shared composables ─────────────────────────────────────────────────────────

/**
 * Visual explosion meter: progress bar showing white pip total vs threshold,
 * plus a colour-coded explosion risk percentage.
 */
@Composable
fun ExplosionMeter(whitePips: Int, threshold: Int, risk: Float) {
    val fraction = (whitePips.toFloat() / threshold).coerceIn(0f, 1f)
    val barColor = when {
        fraction >= 1f -> Color(0xFFD32F2F)
        fraction >= 0.7f -> Color(0xFFFF6F00)
        else -> Color(0xFF388E3C)
    }
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("$whitePips/$threshold 💣", style = MaterialTheme.typography.labelSmall)
            Text(
                "${(risk * 100).roundToInt()}% risk",
                style = MaterialTheme.typography.labelSmall,
                color = if (risk > 0.5f) Color(0xFFFF6F00) else MaterialTheme.colorScheme.onSurface,
                fontWeight = if (risk > 0.5f) FontWeight.Bold else FontWeight.Normal,
            )
        }
        LinearProgressIndicator(
            progress = { fraction },
            modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
            color = barColor,
            trackColor = MaterialTheme.colorScheme.surface,
        )
    }
}

/**
 * Coloured circular chip badge. Shows pip value and optional count overlay.
 * Sizing is controlled by the caller via [modifier].
 */
@Composable
fun ChipBadge(chip: Chip, count: Int = 1, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(CircleShape)
            .background(chip.color.color)
            .border(1.dp, Color.White.copy(alpha = 0.25f), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "${chip.value}",
                color = chip.color.textColor,
                style = MaterialTheme.typography.labelMedium,
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
