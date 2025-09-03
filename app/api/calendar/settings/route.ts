import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { entityService } from '@/lib/entities/entity-service';

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get calendar settings for the organization
    const settingsResults = await entityService.searchEntities(
      orgId,
      'calendar_settings',
      { orgId }
    );

    let settings = {};
    
    if (settingsResults.length > 0) {
      settings = settingsResults[0].data;
    }

    return NextResponse.json({ 
      settings,
      hasSettings: settingsResults.length > 0
    });

  } catch (error) {
    console.error('Error fetching calendar settings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calendar settings' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { settings } = await request.json();
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings data required' }, { status: 400 });
    }

    // Check if settings already exist
    const existingSettings = await entityService.searchEntities(
      orgId,
      'calendar_settings',
      { orgId }
    );

    const settingsData = {
      ...settings,
      orgId,
      updatedBy: userId,
      updatedAt: new Date()
    };

    let result;

    if (existingSettings.length > 0) {
      // Update existing settings
      result = await entityService.updateEntity(
        existingSettings[0].id,
        settingsData,
        { userId, orgId }
      );
    } else {
      // Create new settings
      result = await entityService.createEntity({
        type: 'calendar_settings',
        data: {
          ...settingsData,
          createdBy: userId,
          createdAt: new Date()
        }
      }, { userId, orgId });
    }

    return NextResponse.json({ 
      success: true,
      settings: result.data,
      message: 'Calendar settings saved successfully'
    });

  } catch (error) {
    console.error('Error saving calendar settings:', error);
    return NextResponse.json({ 
      error: 'Failed to save calendar settings' 
    }, { status: 500 });
  }
}