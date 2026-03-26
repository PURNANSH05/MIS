#!/usr/bin/env python
"""
Professional Login/Logout Tracking Service
Comprehensive session management and audit trail
"""

import re
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from database import LoginSession, User, AuditLog
import logging

logger = logging.getLogger(__name__)

class LoginTracker:
    """Professional login/logout tracking service"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def parse_user_agent(self, user_agent: str) -> Dict[str, str]:
        """Parse user agent string to extract browser, OS, and device info"""
        try:
            # Browser detection
            browsers = {
                'Chrome': r'Chrome/(\d+\.\d+)',
                'Firefox': r'Firefox/(\d+\.\d+)',
                'Safari': r'Safari/(\d+\.\d+)',
                'Edge': r'Edge/(\d+\.\d+)',
                'Opera': r'Opera/(\d+\.\d+)',
                'IE': r'MSIE (\d+\.\d+)|Trident/.*rv:(\d+\.\d+)'
            }
            
            browser = "Unknown"
            for name, pattern in browsers.items():
                match = re.search(pattern, user_agent)
                if match:
                    browser = f"{name} {match.group(1) if match.groups() else ''}"
                    break
            
            # Operating System detection
            os_patterns = {
                'Windows': r'Windows NT (\d+\.\d+)',
                'Mac': r'Mac OS X (\d+[._]\d+)',
                'Linux': r'Linux',
                'Android': r'Android (\d+\.\d+)',
                'iOS': r'iPhone OS (\d+[._]\d+)|iPad.*OS (\d+[._]\d+)'
            }
            
            operating_system = "Unknown"
            for name, pattern in os_patterns.items():
                match = re.search(pattern, user_agent)
                if match:
                    operating_system = f"{name} {match.group(1) if match.groups() else ''}"
                    break
            
            # Device type detection
            device_type = "Desktop"
            if any(keyword in user_agent.lower() for keyword in ['mobile', 'android', 'iphone', 'ipad']):
                if 'ipad' in user_agent.lower():
                    device_type = "Tablet"
                else:
                    device_type = "Mobile"
            
            return {
                'browser': browser.strip(),
                'operating_system': operating_system.strip(),
                'device_type': device_type
            }
        except Exception as e:
            logger.error(f"Error parsing user agent: {e}")
            return {
                'browser': 'Unknown',
                'operating_system': 'Unknown',
                'device_type': 'Unknown'
            }
    
    def track_login(self, user: User, session_token: str, ip_address: str, 
                   user_agent: str, request) -> LoginSession:
        """Track user login with comprehensive details"""
        try:
            # Parse user agent
            device_info = self.parse_user_agent(user_agent)
            
            # Create login session
            login_session = LoginSession(
                user_id=user.id,
                session_token=session_token,
                ip_address=ip_address,
                user_agent=user_agent,
                browser=device_info['browser'],
                operating_system=device_info['operating_system'],
                device_type=device_info['device_type'],
                login_status="ACTIVE",
                last_activity=datetime.utcnow()
            )
            
            self.db.add(login_session)
            
            # Update user's last login
            user.last_login = datetime.utcnow()
            
            # Create audit log entry
            audit_log = AuditLog(
                user_id=user.id,
                action="LOGIN",
                module="AUTH",
                record_id=login_session.id,
                new_value=f"IP={ip_address}, Browser={device_info['browser']}, Device={device_info['device_type']}",
                status="SUCCESS",
                remarks=f"User logged in from {ip_address} using {device_info['browser']} on {device_info['operating_system']}",
                ip_address=ip_address,
                timestamp=datetime.utcnow()
            )
            self.db.add(audit_log)
            
            self.db.commit()
            
            logger.info(f"Login tracked: User {user.username} from {ip_address}")
            return login_session
            
        except Exception as e:
            logger.error(f"Error tracking login: {e}")
            self.db.rollback()
            raise
    
    def track_logout(self, session_token: str, logout_reason: str = "MANUAL") -> bool:
        """Track user logout with session details"""
        try:
            # Find active session
            session = self.db.query(LoginSession).filter(
                LoginSession.session_token == session_token,
                LoginSession.is_active == True,
                LoginSession.login_status == "ACTIVE"
            ).first()
            
            if not session:
                logger.warning(f"No active session found for token: {session_token[:20]}...")
                return False
            
            # Calculate session duration
            logout_time = datetime.utcnow()
            session_duration = int((logout_time - session.login_time).total_seconds())
            
            # Update session
            session.logout_time = logout_time
            session.session_duration = session_duration
            session.login_status = "LOGGED_OUT"
            session.logout_reason = logout_reason
            session.is_active = False
            
            # Create audit log entry
            audit_log = AuditLog(
                user_id=session.user_id,
                action="LOGOUT",
                module="AUTH",
                record_id=session.id,
                old_value=f"Duration={session_duration}s, IP={session.ip_address}",
                new_value=f"Logout reason: {logout_reason}",
                status="SUCCESS",
                remarks=f"User logged out after {session_duration} seconds. Reason: {logout_reason}",
                ip_address=session.ip_address,
                timestamp=logout_time
            )
            self.db.add(audit_log)
            
            self.db.commit()
            
            logger.info(f"Logout tracked: User {session.user.username}, Duration: {session_duration}s")
            return True
            
        except Exception as e:
            logger.error(f"Error tracking logout: {e}")
            self.db.rollback()
            return False
    
    def update_last_activity(self, session_token: str) -> bool:
        """Update last activity time for active session"""
        try:
            session = self.db.query(LoginSession).filter(
                LoginSession.session_token == session_token,
                LoginSession.is_active == True
            ).first()
            
            if session:
                session.last_activity = datetime.utcnow()
                self.db.commit()
                return True
            return False
            
        except Exception as e:
            logger.error(f"Error updating last activity: {e}")
            return False
    
    def get_active_sessions(self, user_id: Optional[int] = None) -> list:
        """Get all active sessions, optionally filtered by user"""
        try:
            query = self.db.query(LoginSession).filter(
                LoginSession.is_active == True,
                LoginSession.login_status == "ACTIVE"
            )
            
            if user_id:
                query = query.filter(LoginSession.user_id == user_id)
            
            return query.order_by(LoginSession.login_time.desc()).all()
            
        except Exception as e:
            logger.error(f"Error getting active sessions: {e}")
            return []
    
    def get_user_login_history(self, user_id: int, limit: int = 50) -> list:
        """Get login history for a specific user"""
        try:
            return self.db.query(LoginSession).filter(
                LoginSession.user_id == user_id
            ).order_by(LoginSession.login_time.desc()).limit(limit).all()
            
        except Exception as e:
            logger.error(f"Error getting user login history: {e}")
            return []
    
    def get_login_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive login statistics"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Total logins
            total_logins = self.db.query(LoginSession).filter(
                LoginSession.login_time >= start_date
            ).count()
            
            # Unique users
            unique_users = self.db.query(LoginSession.user_id).filter(
                LoginSession.login_time >= start_date
            ).distinct().count()
            
            # Active sessions
            active_sessions = self.db.query(LoginSession).filter(
                LoginSession.is_active == True,
                LoginSession.login_status == "ACTIVE"
            ).count()
            
            # Average session duration
            completed_sessions = self.db.query(LoginSession).filter(
                LoginSession.logout_time.isnot(None),
                LoginSession.login_time >= start_date
            ).all()
            
            avg_duration = 0
            if completed_sessions:
                total_duration = sum([s.session_duration or 0 for s in completed_sessions])
                avg_duration = total_duration // len(completed_sessions)
            
            # Device breakdown
            device_stats = self.db.query(
                LoginSession.device_type,
                self.db.func.count(LoginSession.id).label('count')
            ).filter(
                LoginSession.login_time >= start_date
            ).group_by(LoginSession.device_type).all()
            
            return {
                'total_logins': total_logins,
                'unique_users': unique_users,
                'active_sessions': active_sessions,
                'average_session_duration': avg_duration,
                'device_breakdown': dict(device_stats),
                'period_days': days
            }
            
        except Exception as e:
            logger.error(f"Error getting login statistics: {e}")
            return {}
    
    def cleanup_expired_sessions(self, hours: int = 24) -> int:
        """Clean up expired sessions (older than specified hours)"""
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            
            expired_sessions = self.db.query(LoginSession).filter(
                LoginSession.last_activity < cutoff_time,
                LoginSession.is_active == True,
                LoginSession.login_status == "ACTIVE"
            ).all()
            
            count = 0
            for session in expired_sessions:
                session.login_status = "EXPIRED"
                session.logout_reason = "TIMEOUT"
                session.is_active = False
                session.logout_time = datetime.utcnow()
                count += 1
            
            self.db.commit()
            logger.info(f"Cleaned up {count} expired sessions")
            return count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired sessions: {e}")
            self.db.rollback()
            return 0
