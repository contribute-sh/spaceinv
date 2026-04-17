export type AABB = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CollisionBulletOwner = "player" | "alien";

export type CollisionBullet = AABB & {
  alive: boolean;
  owner: CollisionBulletOwner;
};

export type CollisionAlien = AABB & {
  alive: boolean;
};

export type CollisionPlayer = AABB & {
  alive: boolean;
};

export type BulletVsAlienCollision = {
  type: "bullet-vs-alien";
  bullet: CollisionBullet;
  alien: CollisionAlien;
};

export type BulletVsPlayerCollision = {
  type: "bullet-vs-player";
  bullet: CollisionBullet;
  player: CollisionPlayer;
};

export type CollisionEvents = {
  bulletVsAlien: BulletVsAlienCollision[];
  bulletVsPlayer: BulletVsPlayerCollision[];
};

// Boxes must overlap with positive area; touching at an edge or corner is not a collision.
export function intersects(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function detectCollisions(
  bullets: ReadonlyArray<CollisionBullet>,
  aliens: ReadonlyArray<CollisionAlien>,
  player: CollisionPlayer,
): CollisionEvents {
  const bulletVsAlien: BulletVsAlienCollision[] = [];
  const bulletVsPlayer: BulletVsPlayerCollision[] = [];

  for (const bullet of bullets) {
    if (!bullet.alive) {
      continue;
    }

    if (bullet.owner === "player") {
      for (const alien of aliens) {
        if (!alien.alive) {
          continue;
        }

        if (intersects(bullet, alien)) {
          bulletVsAlien.push({
            type: "bullet-vs-alien",
            bullet,
            alien,
          });
        }
      }

      continue;
    }

    if (player.alive && intersects(bullet, player)) {
      bulletVsPlayer.push({
        type: "bullet-vs-player",
        bullet,
        player,
      });
    }
  }

  return {
    bulletVsAlien,
    bulletVsPlayer,
  };
}
