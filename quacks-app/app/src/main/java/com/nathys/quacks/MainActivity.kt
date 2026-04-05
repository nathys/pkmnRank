package com.nathys.quacks

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.nathys.quacks.data.GamePhase
import com.nathys.quacks.ui.screens.DrawingScreen
import com.nathys.quacks.ui.screens.SetupScreen
import com.nathys.quacks.ui.screens.ShopScreen
import com.nathys.quacks.ui.theme.QuacksTheme
import com.nathys.quacks.viewmodel.GameViewModel

/**
 * Single-activity entry point. Navigation is driven by [GamePhase] in the
 * ViewModel state rather than a NavHost, since the phase transition logic
 * lives in [GameViewModel] and there are only 3 screens.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            QuacksTheme {
                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .safeDrawingPadding(),
                ) {
                    val viewModel: GameViewModel = viewModel()
                    val state by viewModel.state.collectAsState()

                    when (state.phase) {
                        GamePhase.SETUP -> SetupScreen(viewModel)
                        GamePhase.DRAWING -> DrawingScreen(viewModel, state)
                        GamePhase.SHOP -> ShopScreen(viewModel, state)
                    }
                }
            }
        }
    }
}
