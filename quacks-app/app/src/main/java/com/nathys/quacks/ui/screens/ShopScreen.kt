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
import androidx.compose.ui.unit.dp
import com.nathys.quacks.data.GameState
import com.nathys.quacks.data.Player
import com.nathys.quacks.data.SHOP_OFFERINGS
import com.nathys.quacks.viewmodel.GameViewModel

/**
 * Shop phase screen. Each player sees their coin balance and a list of chips
 * available to purchase. Uses a horizontal pager so each player can shop
 * independently on the same screen.
 */
@Composable
fun ShopScreen(viewModel: GameViewModel, state: GameState) {
    val pagerState = rememberPagerState(pageCount = { state.players.size })

    Column(modifier = Modifier.fillMaxSize()) {
        // ── Tab strip showing player names ───────────────────────────────────
        ScrollableTabRow(selectedTabIndex = pagerState.currentPage, edgePadding = 0.dp) {
            state.players.forEachIndexed { index, player ->
                Tab(
                    selected = pagerState.currentPage == index,
                    onClick = { /* controlled by pager swipe */ },
                    text = { Text("${player.name}\n${player.coins}¢") },
                )
            }
        }

        // ── Per-player shop page ─────────────────────────────────────────────
        HorizontalPager(state = pagerState, modifier = Modifier.weight(1f)) { page ->
            PlayerShopPage(player = state.players[page], viewModel = viewModel)
        }

        // ── End round button ─────────────────────────────────────────────────
        Button(
            onClick = { viewModel.endRound() },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
        ) {
            Text("End Shop Phase → Round ${state.round + 1}")
        }
    }
}

/**
 * Shop UI for a single player: shows current coins and all purchasable chips.
 */
@Composable
private fun PlayerShopPage(player: Player, viewModel: GameViewModel) {
    // Track which chip types this player has already bought this round
    // (the base game allows purchasing one chip of each ingredient colour per round)
    val purchased = remember(player.id) { mutableStateSetOf<String>() }

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
        Text("Buy chips (one per colour)", style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(8.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(SHOP_OFFERINGS, key = { "${it.first.color}-${it.first.value}" }) { (chip, cost) ->
                val key = "${chip.color}-${chip.value}"
                val alreadyBought = purchased.contains(key)
                val canAfford = player.coins >= cost

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surface)
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    // Chip visual + label
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        ChipBadge(chip = chip, modifier = Modifier.size(48.dp))
                        Column {
                            Text(chip.color.displayName, style = MaterialTheme.typography.bodyLarge)
                            Text("Value ${chip.value}", style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                        }
                    }

                    // Price + buy button
                    Column(horizontalAlignment = Alignment.End) {
                        Text("${cost}¢", style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.height(4.dp))
                        Button(
                            onClick = {
                                viewModel.buyChip(player.id, chip, cost)
                                purchased.add(key)
                            },
                            enabled = canAfford && !alreadyBought,
                        ) {
                            Text(if (alreadyBought) "Bought" else "Buy")
                        }
                    }
                }
            }
        }
    }
}
