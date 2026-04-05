package com.nathys.quacks.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.nathys.quacks.viewmodel.GameViewModel

/**
 * Lets the user choose 1–4 players and enter their names before starting.
 */
@Composable
fun SetupScreen(viewModel: GameViewModel) {
    var playerCount by remember { mutableIntStateOf(2) }
    // Mutable name slots; extra slots are ignored when playerCount decreases
    val names = remember { mutableStateListOf("Player 1", "Player 2", "Player 3", "Player 4") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Quacks Helper", style = MaterialTheme.typography.headlineLarge)
        Text("Set up your game", style = MaterialTheme.typography.titleMedium)

        Spacer(Modifier.height(8.dp))

        // ── Player count selector ────────────────────────────────────────────
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Players:", style = MaterialTheme.typography.bodyLarge)
            IconButton(
                onClick = { if (playerCount > 1) playerCount-- },
                enabled = playerCount > 1,
            ) { Icon(Icons.Default.Remove, "Decrease players") }
            Text("$playerCount", style = MaterialTheme.typography.headlineSmall)
            IconButton(
                onClick = { if (playerCount < 4) playerCount++ },
                enabled = playerCount < 4,
            ) { Icon(Icons.Default.Add, "Increase players") }
        }

        Spacer(Modifier.height(8.dp))

        // ── Name inputs ──────────────────────────────────────────────────────
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
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

        Spacer(Modifier.weight(1f))

        Button(
            onClick = { viewModel.startGame(names.take(playerCount)) },
            modifier = Modifier.fillMaxWidth(),
            enabled = names.take(playerCount).all { it.isNotBlank() },
        ) {
            Text("Start Game")
        }
    }
}
