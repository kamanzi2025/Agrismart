import prisma from '../utils/prisma';

// ─────────────────────────────────────────────────────────────────
// sendSMS
// ─────────────────────────────────────────────────────────────────

export async function sendSMS(phone: string, message: string): Promise<void> {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME ?? 'sandbox';

  if (apiKey) {
    try {
      const body = new URLSearchParams({
        username,
        to: phone,
        message,
      });

      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        console.error('[SMS] Africa\'s Talking API error:', response.status, await response.text());
      }
    } catch (err) {
      console.error('[SMS] Failed to send SMS via Africa\'s Talking:', err);
    }
  } else {
    console.log('[SMS]', phone, message);
  }

  // Write AuditLog entry — skip silently on FK violation (system SMS has no userId in users table)
  try {
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'SMS_SENT',
        resourceType: 'notification',
        resourceId: phone,
        metadata: { message },
      },
    });
  } catch {
    // Silently ignore FK violations for system-generated SMS
  }
}

// ─────────────────────────────────────────────────────────────────
// sendPlantingReminder
// ─────────────────────────────────────────────────────────────────

export async function sendPlantingReminder(farmerId: string): Promise<void> {
  const farmer = await prisma.user.findUnique({
    where: { id: farmerId },
    select: { phone: true },
  });

  if (!farmer) {
    console.error('[SMS] sendPlantingReminder: Farmer not found:', farmerId);
    return;
  }

  const message =
    "AgriSmart: It's time to plant! Check your planting advisory for optimal dates.";
  await sendSMS(farmer.phone, message);
}
