-- Fix mentor-student worklet assignments
-- Assign students to worklets that belong to mentors

-- First, let's see current state
SELECT 'CURRENT STATE' as status;
SELECT 
    w.cert_id,
    u_mentor.name as mentor_name,
    COUNT(uwa.id) as student_count
FROM worklets w
JOIN users u_mentor ON u_mentor.id = w.mentor_id
LEFT JOIN user_worklet_association uwa ON uwa.worklet_id = w.id AND uwa.role_in_worklet = 'Student'
WHERE w.mentor_id IS NOT NULL
GROUP BY w.id, w.cert_id, u_mentor.name
ORDER BY student_count DESC;

-- Now assign students to mentor worklets
-- Get worklet 6 (25TST04WT) assigned to TarunA (mentor_id=9) and assign 3 students

INSERT INTO user_worklet_association (user_id, worklet_id, role_in_worklet, assigned_by, completion_status, progress_percentage)
SELECT 
    s.user_id,
    6 as worklet_id,
    'Student' as role_in_worklet,
    9 as assigned_by,
    'Ongoing' as completion_status,
    30 + (ROW_NUMBER() OVER() * 15) as progress_percentage
FROM (
    SELECT id as user_id FROM users WHERE role = 'Student' LIMIT 3
) s
WHERE NOT EXISTS (
    SELECT 1 FROM user_worklet_association 
    WHERE user_id = s.user_id AND worklet_id = 6
);

-- Assign students to worklet 7 (25TST05SRM)
INSERT INTO user_worklet_association (user_id, worklet_id, role_in_worklet, assigned_by, completion_status, progress_percentage)
SELECT 
    s.user_id,
    7 as worklet_id,
    'Student' as role_in_worklet,
    9 as assigned_by,
    'Ongoing' as completion_status,
    45 + (ROW_NUMBER() OVER() * 10) as progress_percentage
FROM (
    SELECT id as user_id FROM users WHERE role = 'Student' LIMIT 3 OFFSET 2
) s
WHERE NOT EXISTS (
    SELECT 1 FROM user_worklet_association 
    WHERE user_id = s.user_id AND worklet_id = 7
);

-- Assign students to worklet 8 (24ARC01RV)
INSERT INTO user_worklet_association (user_id, worklet_id, role_in_worklet, assigned_by, completion_status, progress_percentage)
SELECT 
    s.user_id,
    8 as worklet_id,
    'Student' as role_in_worklet,
    9 as assigned_by,
    'Ongoing' as completion_status,
    60 + (ROW_NUMBER() OVER() * 5) as progress_percentage
FROM (
    SELECT id as user_id FROM users WHERE role = 'Student' LIMIT 2 OFFSET 4
) s
WHERE NOT EXISTS (
    SELECT 1 FROM user_worklet_association 
    WHERE user_id = s.user_id AND worklet_id = 8
);

-- Verify the assignments
SELECT 'AFTER ASSIGNMENTS' as status;
SELECT 
    w.cert_id,
    u_mentor.name as mentor_name,
    COUNT(uwa.id) as student_count,
    GROUP_CONCAT(u_student.name SEPARATOR ', ') as student_names
FROM worklets w
JOIN users u_mentor ON u_mentor.id = w.mentor_id
LEFT JOIN user_worklet_association uwa ON uwa.worklet_id = w.id AND uwa.role_in_worklet = 'Student'
LEFT JOIN users u_student ON u_student.id = uwa.user_id
WHERE w.mentor_id IS NOT NULL
GROUP BY w.id, w.cert_id, u_mentor.name
ORDER BY student_count DESC;