import agentRequest from '../utils/agentRequest'

export default {
    agentHealth(){
        return agentRequest({ url: '/agent/health' })
    },
    agentModels(){
        return agentRequest({ url: '/agent/models' })
    },
    agentStats(){
        return agentRequest({ url: '/agent/stats' })
    },
    agentSessions(params){
        return agentRequest({ url: '/agent/sessions', data: params })
    },
    agentSession(sessionId){
        return agentRequest({ url: `/agent/sessions/${encodeURIComponent(sessionId)}` })
    },
    agentDeleteSession(sessionId){
        return agentRequest({
            url: `/agent/sessions/${encodeURIComponent(sessionId)}`,
            method: 'delete'
        })
    },
    agentChat(params){
        return agentRequest({ url: '/agent/chat', method: 'post', data: params })
    },
    agentTeach(params){
        return agentRequest({ url: '/agent/teach', method: 'post', data: params })
    },
    agentFeedback(params){
        return agentRequest({ url: '/agent/feedback', method: 'post', data: params })
    },
    agentExport(){
        return agentRequest({ url: '/agent/export', method: 'post' })
    }
}
