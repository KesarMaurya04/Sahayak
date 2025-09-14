import { Router } from 'express';
import { z } from 'zod';
import { buildPrompt, ensureSupportIndex, retrieveContext, belowConfidence } from '../services/rag';
import { chatAnswer } from '../services/ai';
import { requireAuth } from '../middlewares/auth';
import { Ticket } from '../models/Support';
 
const router = Router();
 
const askSchema = z.object({
  body: z.object({
    question: z.string().min(3)
  })
});
 
router.post('/ask', requireAuth, async (req, res, next) => {
  try {
    const { body } = askSchema.parse(req);
 
    await ensureSupportIndex();
 
    const { context, topSim } = await retrieveContext(body.question);
    const system = buildPrompt();
    const user = `Question: ${body.question}\n\nContext:\n${context}\n\nAnswer:`;
 
    const answer = await chatAnswer(system, user);
    let createdTicketId: string | null = null;
 
    if (belowConfidence(topSim)) {
      const t = await Ticket.create({
        userId: req.user!.id,
        subject: `AI Escalation: ${body.question.slice(0, 60)}`,
        category: 'ai_escalation',
        messages: [
          { senderType: 'user', text: body.question },
          { senderType: 'admin', text: 'Auto-created by AI due to low confidence.' }
        ]
      });
      createdTicketId = t._id.toString();
    }
 
    res.json({
      answer,
      confidence: Number(topSim.toFixed(3)),
      ticketId: createdTicketId
    });
  } catch (e) { next(e); }
});
 
export default router;