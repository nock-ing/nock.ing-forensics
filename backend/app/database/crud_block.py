from sqlalchemy.ext.asyncio import AsyncSession

from app.schema.block import Block


async def create_block(db: AsyncSession, block: Block):
    db_block = Block(
        block_hash=block.block_hash,
        timestamp=block.timestamp,
        height=block.height,
        size=block.size,
    )

    db.add(db_block)
    await db.commit()
    await db.refresh(db_block)

    return db_block
