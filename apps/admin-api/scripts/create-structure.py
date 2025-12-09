#!/usr/bin/env python3
"""创建Clean Architecture目录结构的脚本"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent / "src"

# 定义需要创建的目录结构
DIRS = [
    # Presentation Layer
    "presentation/controllers",
    "presentation/dtos",
    "presentation/mappers",
    
    # Application Layer
    "application/auth/use-cases",
    "application/auth/commands",
    "application/auth/queries",
    "application/auth/dtos",
    "application/users",
    "application/shared/interfaces",
    "application/shared/events",
    
    # Domain Layer
    "domain/auth/entities",
    "domain/auth/value-objects",
    "domain/auth/services",
    "domain/auth/events",
    "domain/auth/repositories",
    "domain/users",
    "domain/roles",
    "domain/permissions",
    "domain/tenants",
    "domain/shared/events",
    "domain/shared/value-objects",
    
    # Infrastructure Layer
    "infrastructure/persistence/typeorm/repositories",
    "infrastructure/persistence/typeorm/entities",
    "infrastructure/persistence/mappers",
    "infrastructure/events/handlers",
    "infrastructure/external",
]

def create_dirs():
    """创建所有目录"""
    created = []
    for dir_path in DIRS:
        full_path = BASE_DIR / dir_path
        full_path.mkdir(parents=True, exist_ok=True)
        created.append(str(full_path.relative_to(BASE_DIR.parent)))
    
    print(f"成功创建 {len(created)} 个目录")
    return created

if __name__ == "__main__":
    create_dirs()
