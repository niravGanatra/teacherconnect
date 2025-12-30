"""
Smart Match Algorithm for Faculty Job Board.
Calculates match percentage between job requirements and educator profiles.
"""


def calculate_match_score(job, educator_profile):
    """
    Calculate match percentage between a job and an educator profile.
    
    Scoring breakdown:
    - Subject match: 40 points
    - Board experience match: 20 points
    - Experience years: 20 points
    - Qualification match: 20 points
    
    Returns: Integer 0-100
    """
    score = 0
    
    # ===========================================
    # Subject Match (40 points)
    # ===========================================
    job_subjects = set(job.subject_specialization or job.required_subjects or [])
    edu_subjects = set(educator_profile.expert_subjects or educator_profile.subjects or [])
    
    if job_subjects and edu_subjects:
        matching_subjects = job_subjects & edu_subjects
        if matching_subjects:
            # Partial match based on percentage of required subjects matched
            match_ratio = len(matching_subjects) / len(job_subjects)
            score += int(40 * match_ratio)
    else:
        # If no subjects specified, give full points
        score += 40
    
    # ===========================================
    # Board Experience Match (20 points)
    # ===========================================
    job_boards = set(job.required_board_experience or [])
    edu_boards = set(educator_profile.boards or [])
    
    if job_boards:
        if job_boards & edu_boards:
            score += 20
        elif not edu_boards:
            # No board specified, partial match
            score += 10
    else:
        # No board requirement, full points
        score += 20
    
    # ===========================================
    # Experience Years (20 points)
    # ===========================================
    required_years = job.required_experience_years or 0
    actual_years = educator_profile.experience_years or 0
    
    if actual_years >= required_years:
        score += 20
    elif required_years > 0:
        # Partial credit based on how close they are
        ratio = min(actual_years / required_years, 1.0)
        score += int(20 * ratio)
    else:
        # No experience requirement
        score += 20
    
    # ===========================================
    # Qualification Match (20 points)
    # ===========================================
    qualification_hierarchy = {
        'ANY': 0,
        'GRADUATE': 1,
        'B_ED': 2,
        'NTT': 2,
        'D_ED': 2,
        'POST_GRADUATE': 3,
        'M_ED': 4,
        'M_PHIL': 5,
        'PHD': 6,
    }
    
    required_qual = job.min_qualification or 'ANY'
    educator_quals = educator_profile.qualifications or []
    
    if required_qual == 'ANY':
        score += 20
    elif educator_quals:
        # Check if educator has equal or higher qualification
        required_level = qualification_hierarchy.get(required_qual, 0)
        
        # Map educator qualifications to hierarchy levels
        highest_level = 0
        for qual in educator_quals:
            # Normalize qualification format
            qual_key = qual.upper().replace('.', '_').replace(' ', '_')
            level = qualification_hierarchy.get(qual_key, 0)
            highest_level = max(highest_level, level)
        
        if highest_level >= required_level:
            score += 20
        else:
            # Partial credit
            ratio = highest_level / max(required_level, 1)
            score += int(20 * ratio)
    
    return min(score, 100)


def get_match_badge(score):
    """
    Get display badge text based on match score.
    """
    if score >= 90:
        return {'text': 'Excellent Match', 'color': 'green', 'icon': '🌟'}
    elif score >= 75:
        return {'text': 'Great Match', 'color': 'blue', 'icon': '✨'}
    elif score >= 60:
        return {'text': 'Good Match', 'color': 'yellow', 'icon': '👍'}
    elif score >= 40:
        return {'text': 'Partial Match', 'color': 'orange', 'icon': '📋'}
    else:
        return {'text': 'Low Match', 'color': 'gray', 'icon': '📝'}


def get_jobs_with_match_scores(jobs_queryset, educator_profile):
    """
    Add match scores to a queryset of jobs.
    Returns list of dicts with job and match info.
    """
    results = []
    for job in jobs_queryset:
        score = calculate_match_score(job, educator_profile)
        badge = get_match_badge(score)
        results.append({
            'job': job,
            'match_score': score,
            'match_badge': badge,
        })
    
    # Sort by match score descending
    results.sort(key=lambda x: x['match_score'], reverse=True)
    return results
