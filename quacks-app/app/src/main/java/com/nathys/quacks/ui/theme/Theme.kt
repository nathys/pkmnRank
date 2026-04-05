package com.nathys.quacks.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFD4A017),       // potion gold
    onPrimary = Color(0xFF1A1A1A),
    secondary = Color(0xFF8B4513),     // wooden brown
    background = Color(0xFF1C1008),    // dark parchment
    surface = Color(0xFF2D1F0E),
    onBackground = Color(0xFFF5E6C8),
    onSurface = Color(0xFFF5E6C8),
)

@Composable
fun QuacksTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content,
    )
}
