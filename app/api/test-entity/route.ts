import { NextRequest, NextResponse } from 'next/server';
import { entityService } from '@/lib/entities/entity-service';

export async function POST(request: NextRequest) {
  try {
    const { type, data, workspaceId } = await request.json();

    if (!type || !data || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create entity directly using EntityService
    const entity = await entityService.create(
      workspaceId,
      type,
      data,
      {},
      { createdBy: 'test-user' }
    );

    return NextResponse.json({
      success: true,
      id: entity.id,
      type: entity.type,
      data: entity.data,
      message: `Created ${type} entity successfully`
    });

  } catch (error) {
    console.error('Test entity creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create entity' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId');
    const type = url.searchParams.get('type');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Find entities
    const entities = await entityService.find({
      workspaceId,
      type: type || undefined,
      limit: 20,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });

    return NextResponse.json({
      success: true,
      count: entities.length,
      entities
    });

  } catch (error) {
    console.error('Test entity fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch entities' },
      { status: 500 }
    );
  }
}