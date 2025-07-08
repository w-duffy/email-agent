import { db } from './db.js';
import { users, threads, emails, draft_responses, agent_actions } from './schema.js';
import { eq } from 'drizzle-orm';

async function seed() {
  try {
    console.log('Starting database seed...');

    // Clear existing data in reverse order of dependencies
    await db.delete(agent_actions);
    await db.delete(draft_responses);
    await db.delete(emails);
    await db.delete(threads);
    await db.delete(users);

    // Insert sample users
    const insertedUsers = await db.insert(users).values([
      {
        email: 'john.agent@company.com',
        name: 'John Agent',
        role: 'agent'
      },
      {
        email: 'sarah.manager@company.com',
        name: 'Sarah Manager',
        role: 'manager'
      },
      {
        email: 'mike.admin@company.com',
        name: 'Mike Admin',
        role: 'admin'
      }
    ]).returning();

    console.log(`✓ Inserted ${insertedUsers.length} users`);

    // Insert sample threads
    const insertedThreads = await db.insert(threads).values([
      {
        subject: 'Product Support: Login Issues',
        participant_emails: ['customer1@example.com', 'john.agent@company.com'],
        status: 'active',
        last_activity_at: new Date()
      },
      {
        subject: 'Billing Question: Subscription Renewal',
        participant_emails: ['customer2@example.com', 'sarah.manager@company.com'],
        status: 'needs_attention',
        last_activity_at: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        subject: 'Feature Request: API Documentation',
        participant_emails: ['customer3@example.com', 'mike.admin@company.com'],
        status: 'closed',
        last_activity_at: new Date(Date.now() - 172800000) // 2 days ago
      }
    ]).returning();

    console.log(`✓ Inserted ${insertedThreads.length} threads`);

    // Insert sample emails
    const insertedEmails = await db.insert(emails).values([
      {
        thread_id: insertedThreads[0].id,
        from_email: 'customer1@example.com',
        to_emails: ['john.agent@company.com'],
        subject: 'Product Support: Login Issues',
        body_text: 'Hi, I\'m having trouble logging into my account. Can you help?',
        body_html: '<p>Hi, I\'m having trouble logging into my account. Can you help?</p>',
        direction: 'inbound',
        sent_at: new Date()
      },
      {
        thread_id: insertedThreads[0].id,
        from_email: 'john.agent@company.com',
        to_emails: ['customer1@example.com'],
        subject: 'Re: Product Support: Login Issues',
        body_text: 'Hello! I\'d be happy to help you with your login issues. Can you try resetting your password?',
        body_html: '<p>Hello! I\'d be happy to help you with your login issues. Can you try resetting your password?</p>',
        direction: 'outbound',
        sent_at: new Date()
      },
      {
        thread_id: insertedThreads[1].id,
        from_email: 'customer2@example.com',
        to_emails: ['sarah.manager@company.com'],
        cc_emails: ['billing@company.com'],
        subject: 'Billing Question: Subscription Renewal',
        body_text: 'When will my subscription renew and what\'s the cost?',
        body_html: '<p>When will my subscription renew and what\'s the cost?</p>',
        direction: 'inbound',
        sent_at: new Date(Date.now() - 86400000)
      },
      {
        thread_id: insertedThreads[2].id,
        from_email: 'customer3@example.com',
        to_emails: ['mike.admin@company.com'],
        subject: 'Feature Request: API Documentation',
        body_text: 'Could you provide more detailed API documentation with examples?',
        body_html: '<p>Could you provide more detailed API documentation with examples?</p>',
        direction: 'inbound',
        sent_at: new Date(Date.now() - 172800000)
      },
      {
        thread_id: insertedThreads[2].id,
        from_email: 'mike.admin@company.com',
        to_emails: ['customer3@example.com'],
        subject: 'Re: Feature Request: API Documentation',
        body_text: 'Thank you for your feedback. We\'ve updated our API documentation with more examples.',
        body_html: '<p>Thank you for your feedback. We\'ve updated our API documentation with more examples.</p>',
        direction: 'outbound',
        sent_at: new Date(Date.now() - 172800000 + 3600000)
      },
      {
        thread_id: insertedThreads[1].id,
        from_email: 'sarah.manager@company.com',
        to_emails: ['customer2@example.com'],
        subject: 'Re: Billing Question: Subscription Renewal',
        body_text: 'Your subscription will renew on the 15th of next month for $49.99.',
        direction: 'outbound',
        is_draft: true
      }
    ]).returning();

    console.log(`✓ Inserted ${insertedEmails.length} emails`);

    // Insert sample draft responses
    const insertedDrafts = await db.insert(draft_responses).values([
      {
        email_id: insertedEmails[0].id,
        thread_id: insertedThreads[0].id,
        generated_content: 'Thank you for contacting support. I can help you resolve your login issues. Please try the following steps: 1) Clear your browser cache, 2) Try a different browser, 3) Reset your password using the forgot password link.',
        status: 'pending',
        created_by_user_id: null, // AI-generated
        confidence_score: '0.85'
      },
      {
        email_id: insertedEmails[2].id,
        thread_id: insertedThreads[1].id,
        generated_content: 'Hi there! Your subscription is set to auto-renew on the 15th of next month. The renewal cost will be $49.99. You can manage your subscription settings in your account dashboard.',
        status: 'approved',
        created_by_user_id: insertedUsers[1].id, // Sarah Manager
        confidence_score: '0.92'
      },
      {
        email_id: insertedEmails[3].id,
        thread_id: insertedThreads[2].id,
        generated_content: 'Thank you for your feature request. We appreciate your feedback about our API documentation. Our development team is working on improving the documentation with more comprehensive examples.',
        status: 'rejected',
        created_by_user_id: insertedUsers[2].id, // Mike Admin
        confidence_score: '0.78'
      },
      {
        email_id: insertedEmails[3].id,
        thread_id: insertedThreads[2].id,
        generated_content: 'Thank you for your valuable feedback regarding our API documentation. We\'ve reviewed your request and have updated our documentation with additional examples and use cases. You can find the updated documentation at docs.company.com/api.',
        status: 'sent',
        created_by_user_id: insertedUsers[2].id, // Mike Admin
        parent_draft_id: null, // Will be set to the previous draft ID
        version: 2,
        confidence_score: '0.94'
      }
    ]).returning();

    // Update the last draft to reference the previous one as parent
    await db.update(draft_responses)
      .set({ parent_draft_id: insertedDrafts[2].id })
      .where(eq(draft_responses.id, insertedDrafts[3].id));

    console.log(`✓ Inserted ${insertedDrafts.length} draft responses`);

    // Insert sample agent actions
    const insertedActions = await db.insert(agent_actions).values([
      {
        thread_id: insertedThreads[0].id,
        email_id: insertedEmails[0].id,
        actor_user_id: insertedUsers[0].id, // John Agent
        action: 'email_read',
        metadata: { read_duration_seconds: 45, device: 'desktop' },
        ip_address: '192.168.1.100'
      },
      {
        thread_id: insertedThreads[0].id,
        email_id: insertedEmails[0].id,
        draft_response_id: insertedDrafts[0].id,
        actor_user_id: null, // AI system action
        action: 'draft_created',
        metadata: { 
          model: 'gpt-4',
          confidence_score: '0.85',
          processing_time_ms: 1250,
          tokens_used: 342
        }
      },
      {
        thread_id: insertedThreads[1].id,
        email_id: insertedEmails[2].id,
        draft_response_id: insertedDrafts[1].id,
        actor_user_id: insertedUsers[1].id, // Sarah Manager
        action: 'draft_approved',
        metadata: { 
          approval_notes: 'Looks good, send it out',
          reviewed_duration_seconds: 120 
        },
        ip_address: '192.168.1.101'
      },
      {
        thread_id: insertedThreads[2].id,
        actor_user_id: insertedUsers[2].id, // Mike Admin
        action: 'thread_status_changed',
        metadata: { 
          old_status: 'active',
          new_status: 'closed',
          reason: 'Issue resolved'
        },
        ip_address: '192.168.1.102'
      }
    ]).returning();

    console.log(`✓ Inserted ${insertedActions.length} agent actions`);

    console.log('✅ Database seed completed successfully!');
    console.log('\nSeeded data summary:');
    console.log(`- Users: ${insertedUsers.length} (agent, manager, admin)`);
    console.log(`- Threads: ${insertedThreads.length} (active, needs_attention, closed)`);
    console.log(`- Emails: ${insertedEmails.length} (mix of inbound/outbound, includes 1 draft)`);
    console.log(`- Draft responses: ${insertedDrafts.length} (pending, approved, rejected, sent)`);
    console.log(`- Agent actions: ${insertedActions.length} (email_read, draft_created, draft_approved, thread_status_changed)`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seed;
