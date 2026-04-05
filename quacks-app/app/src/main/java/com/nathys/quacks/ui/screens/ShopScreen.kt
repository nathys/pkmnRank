package com.nathys.quacks.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import com.nathys.quacks.data.*
import com.nathys.quacks.viewmodel.GameViewModel

/**
 * Shop phase screen. Each player sees their coin balance and the available chips
 * for the active ingredient books, with live supply counts.
 *
 * Uses a horizontal pager so each player can shop independently. Tabs are also
 * tappable for quick navigation.
 */
@Composable
fun ShopScreen(viewModel: GameViewModel, state: GameState) {
    val pagerState = rememberPagerState(pageCount = { state.players.size })
    val scope = rememberCoroutineScope()

    // Flatten all shop slots from active books, grouped by colour for display
    val allSlots: List<ShopSlot> = state.selectedBooks.values
        .sortedBy { it.color.ordinal }
        .flatMap { it.shopSlots }

    Column(modifier = Modifier.fillMaxSize()) {
        // Tab strip — swipe or tap to navigate between players
        ScrollableTabRow(selectedTabIndex = pagerState.currentPage, edgePadding = 0.dp) {
            state.players.forEachIndexed { index, player ->
                Tab(
                    selected = pagerState.currentPage == index,
                    onClick = { scope.launch { pagerState.animateScrollToPage(index) } },
                    text = { Text("${player.name}\n${player.coins}¢") },
                )
            }
        }

        HorizontalPager(state = pagerState, modifier = Modifier.weight(1f)) { page ->
            PlayerShopPage(
                player = state.players[page],
                slots = allSlots,
                supplyOf = state::supplyOf,
                viewModel = viewModel,
            )
        }

        Button(
            onClick = { viewModel.endRound() },
            modifier = Modifier.fillMaxWidth().padding(16.dp),
        ) {
            Text("End Shop Phase → Round ${state.round + 1}")
        }
    }
}

/**
 * Shop UI for a single player.
 *
 * @param slots     All purchasable slots from the active ingredient books.
 * @param supplyOf  Reads remaining supply for a given chip from the shared pool.
 */
@Composable
private fun PlayerShopPage(
    player: Player,
    slots: List<ShopSlot>,
    supplyOf: (Chip) -> Int,
    viewModel: GameViewModel,
) {
    // Per-player set of chip keys already bought this round (one per colour per round)
    val purchasedColors = remember(player.id) { mutableStateSetOf<ChipColor>() }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        // Coin balance header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(MaterialTheme.colorScheme.surface)
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Coins available", style = MaterialTheme.typography.bodyLarge)
            Text("${player.coins}¢", style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.primary)
        }

        Spacer(Modifier.height(12.dp))
        Text("Buy chips (one colour per round)", style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(8.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(slots, key = { "${it.chip.color}-${it.chip.value}" }) { slot ->
                val supply = supplyOf(slot.chip)
                val colorBought = purchasedColors.contains(slot.chip.color)
                val canAfford = player.coins >= slot.cost
                val soldOut = supply <= 0

                ShopRow(
                    slot = slot,
                    supply = supply,
                    enabled = canAfford && !colorBought && !soldOut,
                    label = when {
                        soldOut -> "Sold out"
                        colorBought -> "Bought"
                        else -> "Buy"
                    },
                    onBuy = {
                        viewModel.buyChip(player.id, slot.chip, slot.cost)
                        purchasedColors.add(slot.chip.color)
                    },
                )
            }
        }
    }
}

@Composable
private fun ShopRow(
    slot: ShopSlot,
    supply: Int,
    enabled: Boolean,
    label: String,
    onBuy: () -> Unit,
) {
    val soldOut = supply <= 0
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(
                if (soldOut) MaterialTheme.colorScheme.surface.copy(alpha = 0.4f)
                else MaterialTheme.colorScheme.surface
            )
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        // Chip badge + ingredient name
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            ChipBadge(
                chip = slot.chip,
                modifier = Modifier.size(48.dp),
            )
            Column {
                Text(
                    slot.chip.color.displayName,
                    style = MaterialTheme.typography.bodyLarge,
                    color = if (soldOut) MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                            else MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    "Value ${slot.chip.value}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                )
            }
        }

        // Supply count + price + buy button
        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(2.dp)) {
            // Supply remaining pill
            Text(
                text = if (soldOut) "SOLD OUT" else "$supply left",
                style = MaterialTheme.typography.labelSmall,
                color = when {
                    soldOut -> Color(0xFFD32F2F)
                    supply <= 2 -> Color(0xFFFF6F00)
                    else -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                },
                textAlign = TextAlign.End,
            )
            Text(
                "${slot.cost}¢",
                style = MaterialTheme.typography.titleMedium,
                color = if (soldOut) MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                        else MaterialTheme.colorScheme.primary,
            )
            Button(
                onClick = onBuy,
                enabled = enabled,
            ) {
                Text(label, style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}
