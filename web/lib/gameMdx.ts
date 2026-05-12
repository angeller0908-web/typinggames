import type { ComponentType } from "react";
import FruitTyping from "@/content/games/fruit-typing.mdx";
import TruckTyper from "@/content/games/truck-typer.mdx";
import TypingFood from "@/content/games/typing-food.mdx";
import ChickenTyping from "@/content/games/chicken-typing.mdx";
import Typing99 from "@/content/games/typing-99.mdx";
import TypingAlien from "@/content/games/typing-alien.mdx";
import TypingMoney from "@/content/games/typing-money.mdx";
import BananaTyping from "@/content/games/banana-typing.mdx";
import KeyboardZoo from "@/content/games/keyboard-zoo.mdx";
import TypingRocket from "@/content/games/typing-rocket.mdx";
import TypingRain from "@/content/games/typing-rain.mdx";
import TypingJets from "@/content/games/typing-jets.mdx";
import KangarooTyping from "@/content/games/kangaroo-typing.mdx";
import TypingSwimmer from "@/content/games/typing-swimmer.mdx";
import MavisBeacon from "@/content/games/mavis-beacon-typing.mdx";
import AsteroidTyping from "@/content/games/asteroid-typing.mdx";
import DanceMat from "@/content/games/dance-mat-typing.mdx";
import TypingBomb from "@/content/games/typing-bomb.mdx";
import TypingFrog from "@/content/games/typing-frog.mdx";
import TypingGhosts from "@/content/games/typing-of-the-ghosts.mdx";

export const GAME_BODY: Record<string, ComponentType<Record<string, unknown>>> = {
  "fruit-typing": FruitTyping,
  "truck-typer": TruckTyper,
  "typing-food": TypingFood,
  "chicken-typing": ChickenTyping,
  "typing-99": Typing99,
  "typing-alien": TypingAlien,
  "typing-money": TypingMoney,
  "banana-typing": BananaTyping,
  "keyboard-zoo": KeyboardZoo,
  "typing-rocket": TypingRocket,
  "typing-rain": TypingRain,
  "typing-jets": TypingJets,
  "kangaroo-typing": KangarooTyping,
  "typing-swimmer": TypingSwimmer,
  "mavis-beacon-typing": MavisBeacon,
  "asteroid-typing": AsteroidTyping,
  "dance-mat-typing": DanceMat,
  "typing-bomb": TypingBomb,
  "typing-frog": TypingFrog,
  "typing-of-the-ghosts": TypingGhosts,
};

export function getGameBody(slug: string): ComponentType<Record<string, unknown>> | null {
  return GAME_BODY[slug] ?? null;
}
